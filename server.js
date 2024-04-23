const ws = require('ws');
let server_ip = [192,168,1,1];
let hostname = "immon-server";



const wss = new ws.WebSocketServer({
  port: 8080,
});

wss.on('connection', (ws) => {
    ws.on('message', (buffer) => {
        let buffer_vue = new Uint8Array(buffer);
        let head = {
            dest_ip: buffer_vue.slice(0, 4),
            src_ip: buffer_vue.slice(4, 8),
            src_hostname: buffer_vue.slice(8, 21),
            protocol: buffer_vue.slice(21, 22),
            dest_port: buffer_vue.slice(22, 24),
            src_port: buffer_vue.slice(24, 26),
            seq_num: buffer_vue.slice(26, 30),
            ack_num: buffer_vue.slice(30, 34),
            flags: buffer_vue.slice(34, 35)
        }
        console.log(head);
    });
    
    ws.send('Hi there, I am a WebSocket server');
});