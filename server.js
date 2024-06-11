const ws = require('ws');
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


const wss = new ws.WebSocketServer({
  port: 8080,
});

immon.set_src_info(server_ip, hostname, 3000);
immon.set_dest_port(3000); // not really used but it's here

const ip_equals = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
}

function search_client(ws = null, ip = null, hostname = null) {
    for(let i = 0; i < clients_list.length; i++) {
        switch(true) {
            case ws != null:
                if(clients_list[i].ws == ws) return i;
                break;
            case ip != null:
                if(ip_equals(ip, clients_list[i].ip)) return i;
                break;
            case hostname != null:
                if(clients_list[i].hostname == hostname) return i;
                break;
        }
    }
    return -1;
}

async function broadcast_message(type, content) {
    for(let i = 0; i < clients_list.length; i++) {
        immon.set_ws(clients_list[i].ws);
        clients_list[i].open = true; // set the client as open to avoid handling the message in the main loop. VERY HARD TO FIND THIS BUG
        await immon.srv_send_message(clients_list[i].ip, type, content); 
        clients_list[i].open = false;
    }
}

wss.on('connection', (ws) => {
    clients_list.push({ip: null, hostname: "unknown", open: false, ws: ws, lastkeepalive: Date.now()}); // add the client to the list
    ws.on('message', async (buffer) => {
        let client_id = search_client(ws);
        if(clients_list[client_id].open) return; // if the client is already open, ignore the message, it will be handled by the etcp module (communication already in progress)
        clients_list[client_id].open = true;
        immon.set_ws(ws); // set the websocket for the etcp module (handling acks)
        let immon_parsed = await immon.handle_buffer(buffer); // handle the buffer
        if(immon_parsed == null) return;
        let head = immon_parsed.head;
        immon_parsed = {origin: immon_parsed.origin, type: immon_parsed.type, content: immon_parsed.content}; // remove the head from the parsed message
        switch(immon_parsed.origin) {
            case "IMMON_ADMIN":
                switch(immon_parsed.type) {
                    case "HEY":
                        process.stdout.write(clients_list[client_id].hostname + " : ");
                        console.log(immon_parsed);
                        if(immon_parsed.content == admin_key) {
                            clients_list[client_id].ip = admin_ip;
                            clients_list[client_id].hostname = "immon-admin";
                            await immon.srv_send_message(admin_ip, "SET_IP", admin_ip.join(".")); // send the admin ip to the admin
                            await immon.srv_send_message(admin_ip, "SET_HOSTNAME", "immon-admin"); // send the hostname to the admin
                            admin_connected = true;
                            await broadcast_message("CLIENTS_LIST", JSON.stringify(clients_list.map(item => {return {ip: item.ip.join("."), hostname: item.hostname}})));
                        }
                        else {
                            await immon.srv_send_message(admin_ip, "ERROR", "Invalid key");
                        }
                        break;
                    case "NEW_CLI":
                        process.stdout.write(clients_list[client_id].hostname + " : ");
                        console.log(immon_parsed);
                        next_client_hostname = immon_parsed.content;
                        break;
                    case "ALIVE":
                        process.stdout.write(clients_list[client_id].hostname + " : ");
                        console.log(immon_parsed);
                        clients_list[client_id].lastkeepalive = Date.now();
                        break;
                    default:
                        await immon.srv_send_message(admin_ip, "ERROR", "Unknown command");
                        break;
                }
                break;
            case "IMMON_CLI":
                switch(immon_parsed.type) {
                    case "HEY":
                        process.stdout.write(clients_list[client_id].hostname + " : ");
                        console.log(immon_parsed);
                        if(clients_list.length >= 250) {
                            await immon.srv_send_message([0,0,0,0], "ERROR", "Server full");
                            break;
                        }
                        clients_list[client_id].ip = [192,168,1, clients_list.length + 1];
                        clients_list[client_id].hostname = next_client_hostname;
                        await immon.srv_send_message(clients_list[client_id].ip, "SET_IP", clients_list[client_id].ip.join("."));
                        await immon.srv_send_message(clients_list[client_id].ip, "SET_HOSTNAME", clients_list[client_id].hostname);
                        await broadcast_message("CLIENTS_LIST", JSON.stringify(clients_list.map(item => {return {ip: item.ip.join("."), hostname: item.hostname}})));
                        break;
                    case "ALIVE":
                        process.stdout.write(clients_list[client_id].hostname + " : ");
                        console.log(immon_parsed);
                        clients_list[client_id].lastkeepalive = Date.now();
                        break;
                    case "MESSAGE":
                        // Forward the message to the destination client
                        process.stdout.write(clients_list[client_id].hostname + " : ");
                        console.log(immon_parsed);
                        
                        let dest_ip = Array.from(head.dest_ip);
                        let dest_id = search_client(null, dest_ip);
                        if(dest_id == -1) {
                            console.log("Unknown client");
                            break;
                        }
                        var str_stc_hostname = new TextDecoder().decode(head.src_hostname);
                        immon.set_src_info(head.src_ip, str_stc_hostname, 3000);
                        immon.set_dest_port(3000); // not really used but it's here
                        clients_list[dest_id].open = true;
                        immon.set_ws(clients_list[dest_id].ws);
                        await immon.cli_send_message(dest_ip, "MESSAGE", immon_parsed.content);
                        clients_list[dest_id].open = false;
                        immon.set_src_info(server_ip, hostname, 3000);
                        immon.set_dest_port(3000); // not really used but it's here

                        break;
                }
                break;
        }
        clients_list[client_id].open = false;
    });
});

async function broadcast_keepalive() {
    // Send a KEEP_ALIVE message to all clients
    for(let i = 0; i < clients_list.length; i++) {
        if(clients_list[i].open) continue; // if the client is already open, doesn't need to be checked
        immon.set_ws(clients_list[i].ws);
        clients_list[i].open = true;
        await immon.srv_send_message(clients_list[i].ip, "KEEP_ALIVE", "");
        clients_list[i].open = false;
    }
}

cron.schedule('*/5 * * * * *', async() => {
    await broadcast_keepalive();
    setTimeout(async () => {
        // console.log(clients_list.map(item => {return {hostname: item.hostname, time: item.lastkeepalive, open: item.open}})); DEBUG
        // Check if the clients are still alive
        for(let i = 0; i < clients_list.length; i++) {
            if(Date.now() - clients_list[i].lastkeepalive > 3000) {
                console.log(`Client ${i} disconnected`);
                if(clients_list[i].ip == admin_ip) {
                    admin_connected = false;
                    clients_list.splice(i, 1);
                    await broadcast_message("ERROR", "Admin disconnected");
                    process.exit();
                }
                clients_list.splice(i, 1);
                await broadcast_message("CLIENTS_LIST", JSON.stringify(clients_list.map(item => {return {ip: item.ip.join("."), hostname: item.hostname}})));
            }
        }
    }, 1000);
});