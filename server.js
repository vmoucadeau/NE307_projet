const ws = require('ws');
const lz78 = require('./utils/lz78.js'); // Import the lz78 module
const frames = require("./utils/frames.js");
const Bufferutils = require("./utils/buffers.js");

const immon = require('./protocols/immon.js');

let server_ip = [192,168,1,1];
let admin_ip = [192,168,1,2];
let hostname = "immon-server";

let client_list = []; // {ip: [192,168,1,2], ws: null}

let received = "";
let ack = 0;

const wss = new ws.WebSocketServer({
  port: 8080,
});

immon.set_src_info(server_ip, hostname, 3000);
immon.set_dest_port(3000); // not really used but it's here

function search_by_ws(ws) {
    for(let i = 0; i < client_list.length; i++) {
        if(client_list[i].ws == ws) {
            return i;
        }
    }
    return -1;
}

function search_by_ip(ip) {
    for(let i = 0; i < client_list.length; i++) {
        if(client_list[i].ip == ip) {
            return i;
        }
    }
    return -1;
}

wss.on('connection', (ws) => {
    client_list.push({ip: null, ws: ws});
    ws.on('message', async (buffer) => {
        immon.set_ws(ws);
        let immon_parsed = await immon.handle_buffer(buffer);
        console.log(immon_parsed);



        
    });
});