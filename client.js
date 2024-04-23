const ws = require('ws');
const frame = require('./utils/frames.js');
const Buffutils = require('./utils/buffers.js');
const lz78 = require('./utils/lz78.js');


// let client = new ws.WebSocket('ws://localhost:8080/');
let client_ip = [192,168,1,5]; // default value (should be changed by the server)
let server_ip = [192,168,1,1];
let client_hostname = "unknown" // default value (should be changed by the server)

// client.on('error', function(error) {
//     console.log('Connect Error: ' + error.toString());
// });



// client.on('open', function(connection) {
//     console.log('Connection established!');
//     let myframe_head = {
//         dest_ip: server_ip,
//         src_ip: client_ip,
//         src_hostname: client_hostname,
//         protocol: Buffutils.int8buffer(0),
//         dest_port: Buffutils.int16buffer(3001),
//         src_port: Buffutils.int16buffer(3001),
//         seq_num: Buffutils.int32buffer(2892),
//         ack_num: Buffutils.int32buffer(3021),
//         flags: Buffutils.int8buffer(0)
//     }
//     let myframe = frame.generate_data_frame('Hello', myframe_head);
//     client.send(myframe);
// });

// client.on('message', function message(data) {
//     console.log('received: %s', data);
// });
