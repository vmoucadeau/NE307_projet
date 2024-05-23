const ws = require('ws');
const lz78 = require('./utils/lz78.js'); // Import the lz78 module
const frames = require("./utils/frames.js");
const Bufferutils = require("./utils/buffers.js");

const immon = require('./protocols/immon.js');

let server_ip = [192,168,1,1];
let admin_ip = [192,168,1,2];
let broadcast_ip = [255,255,255,255];
let hostname = "immon-server";
const admin_key = "s3cr3t";

let client_list = []; // {ip: [192,168,1,2], hostname: "13char", open: false, ws: null}

let received = "";
let ack = 0;

const wss = new ws.WebSocketServer({
  port: 8080,
});

immon.set_src_info(server_ip, hostname, 3000);
immon.set_dest_port(3000); // not really used but it's here

function search_client(ws = null, ip = null, hostname = null) {
    for(let i = 0; i < client_list.length; i++) {
        switch(true) {
            case ws != null:
                if(client_list[i].ws == ws) return i;
                break;
            case ip != null:
                if(client_list[i].ip == ip) return i;
                break;
            case hostname != null:
                if(client_list[i].hostname == hostname) return i;
                break;
        }
    }
    return -1;
}

wss.on('connection', (ws) => {
    client_list.push({ip: null, hostname: "unknown", open: false, ws: ws});
    ws.on('message', async (buffer) => {
        let client_id = search_client(ws);
        if(client_list[client_id].open) return; // if the client is already open, ignore the message, it will be handled by the etcp module
        client_list[client_id].open = true;
        immon.set_ws(ws); // set the websocket for the etcp module (handling acks)
        let immon_parsed = await immon.handle_buffer(buffer); // handle the buffer
        console.log(immon_parsed);
        if(immon_parsed == null) return;
        switch(immon_parsed.origin) {
            case "IMMON_ADMIN":
                switch(immon_parsed.type) {
                    case "HEY":
                        if(immon_parsed.content == admin_key) {
                            await immon.srv_send_message(admin_ip, "SET_IP", admin_ip.join(".")); // send the admin ip to the admin
                            await immon.srv_send_message(admin_ip, "SET_HOSTNAME", "immon-admin"); // send the hostname to the admin
                        }
                        else {
                            await immon.srv_send_message(admin_ip, "ERROR", "Invalid key");
                        }
                        break;
                    default:
                        await immon.srv_send_message(admin_ip, "ERROR", "Unknown command");
                        break;
                }
                break;
            case "IMMON_CLI":
                switch(immon_parsed.type) {
                    case "HEY":
                        let index = search_client(ws);
                        client_list[client_id].ip = immon_parsed.src_ip;
                        await immon.cli_send_message(immon_parsed.src_ip, "HEY", "world", admin_ip);
                        break;
                }
                break;
        }
        client_list[client_id].open = false;
    });
});