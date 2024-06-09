const ws = require('ws');
const lz78 = require('./utils/lz78.js'); // Import the lz78 module
const frames = require("./utils/frames.js");
const Bufferutils = require("./utils/buffers.js");
const cron = require('node-cron');

const immon = require('./protocols/immon.js');

let server_ip = [192,168,1,1];
let admin_ip = [192,168,1,2];
let broadcast_ip = [255,255,255,255];
let hostname = "immon-server";
const admin_key = "s3cr3t";
let admin_connected = false;

let clients_list = []; // {ip: [192,168,1,2], hostname: "13char", open: false, ws: null}
let next_client_hostname = "unknown";

let received = "";
let ack = 0;

const wss = new ws.WebSocketServer({
  port: 8080,
});

immon.set_src_info(server_ip, hostname, 3000);
immon.set_dest_port(3000); // not really used but it's here

function search_client(ws = null, ip = null, hostname = null) {
    for(let i = 0; i < clients_list.length; i++) {
        switch(true) {
            case ws != null:
                if(clients_list[i].ws == ws) return i;
                break;
            case ip != null:
                if(clients_list[i].ip == ip) return i;
                break;
            case hostname != null:
                if(clients_list[i].hostname == hostname) return i;
                break;
        }
    }
    return -1;
}

function broadcast_message(type, content) {
    // console.log(content);
    for(let i = 0; i < clients_list.length; i++) {
        immon.set_ws(clients_list[i].ws);
        immon.srv_send_message(clients_list[i].ip, type, content);
    }
}

wss.on('connection', (ws) => {
    clients_list.push({ip: null, hostname: "unknown", open: false, ws: ws});
    ws.on('message', async (buffer) => {
        let client_id = search_client(ws);
        if(clients_list[client_id].open) return; // if the client is already open, ignore the message, it will be handled by the etcp module (communication already in progress)
        clients_list[client_id].open = true;
        immon.set_ws(ws); // set the websocket for the etcp module (handling acks)
        let immon_parsed = await immon.handle_buffer(buffer); // handle the buffer
        console.log(immon_parsed);
        if(immon_parsed == null) return;
        switch(immon_parsed.origin) {
            case "IMMON_ADMIN":
                switch(immon_parsed.type) {
                    case "HEY":
                        if(immon_parsed.content == admin_key) {
                            clients_list[client_id].ip = admin_ip;
                            clients_list[client_id].hostname = "immon-admin";
                            await immon.srv_send_message(admin_ip, "SET_IP", admin_ip.join(".")); // send the admin ip to the admin
                            await immon.srv_send_message(admin_ip, "SET_HOSTNAME", "immon-admin"); // send the hostname to the admin
                            admin_connected = true;
                            let clients_list_json = JSON.stringify(clients_list.map(item => {return {ip: item.ip.join("."), hostname: item.hostname}})); // generate the clients list
                            broadcast_message("CLIENTS_LIST", clients_list_json);
                        }
                        else {
                            await immon.srv_send_message(admin_ip, "ERROR", "Invalid key");
                        }
                        break;
                    case "NEW_CLI":
                        next_client_hostname = immon_parsed.content;
                        break;
                    default:
                        await immon.srv_send_message(admin_ip, "ERROR", "Unknown command");
                        break;
                }
                break;
            case "IMMON_CLI":
                switch(immon_parsed.type) {
                    case "HEY":
                        if(clients_list.length >= 250) {
                            await immon.srv_send_message([0,0,0,0], "ERROR", "Server full");
                            break;
                        }
                        clients_list[client_id].ip = [192,168,1, clients_list.length + 1];
                        clients_list[client_id].hostname = next_client_hostname;
                        await immon.srv_send_message(clients_list[client_id].ip, "SET_IP", clients_list[client_id].ip.join("."));
                        await immon.srv_send_message(clients_list[client_id].ip, "SET_HOSTNAME", clients_list[client_id].hostname);
                        break;
                }
                break;
        }
        clients_list[client_id].open = false;
    });
});

function check_clients() {
    // Send a KEEP_ALIVE message to all clients
    for(let i = 0; i < clients_list.length; i++) {
        if(clients_list[i].open) continue;
        immon.srv_send_message(clients_list[i].ip, "KEEP_ALIVE", "");
    }
}