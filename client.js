const ws = require('ws');

let client = new ws.WebSocket('ws://localhost:8080/');
let client_ip = [0,0,0,0]; // default value (should be changed by the server)
let server_ip = [192,168,1,1];
let client_hostname = "unknown" // default value (should be changed by the server)


client.on('error', function(error) {
    console.log('Connect Error: ' + error.toString());
});

/*
INPUT: text (string), dest_ip (array of 4 integers)
OUTPUT: list of frames (list of array of 1024 bytes)
*/
function generate_text_frames(text, dest_ip) {
    let buffer = new ArrayBuffer(1024);
    let buffer_vue = new Uint8Array(buffer);
    let buffer_offset = 0;
    let text_len = text.length;
    // Writing destination IP address in the buffer
    for(let i = 0; i < 4; i++) {
        buffer_vue[buffer_offset+i] = dest_ip[i];
    }
    buffer_offset+=4;
    // Writing source IP address in the buffer
    for(let i = 0; i < 4; i++) {
        buffer_vue[buffer_offset+i] = client_ip[i];
    }
    buffer_offset+=4;
    // // Writing client hostname in the buffer
    for(let i = 0; i < 13; i++) {
        buffer_vue[buffer_offset+i] = client_hostname.charCodeAt(i);
    }
    buffer_offset += 13;
    console.log(buffer_vue);
}

client.on('open', function(connection) {
    console.log('Connection established!');
    client.send('IMMON:CLIENT');
    generate_text_frames('Hello', server_ip);
});

client.on('message', function message(data) {
    console.log('received: %s', data);
});