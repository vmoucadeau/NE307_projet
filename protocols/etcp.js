/*
            ________  ______   _______  
            /        |/      \ /       \ 
    ______$$$$$$$$//$$$$$$  |$$$$$$$  |
    /      \  $$ |  $$ |  $$/ $$ |__$$ |
    /$$$$$$  | $$ |  $$ |      $$    $$/ 
    $$    $$ | $$ |  $$ |   __ $$$$$$$/  
    $$$$$$$$/  $$ |  $$ \__/  |$$ |      
    $$       | $$ |  $$    $$/ $$ |      
    $$$$$$$/  $$/    $$$$$$/  $$/       
                                        
    This protocol is eTCP (for eco+ TCP). It's like TCP but with minimal features. It's used for the IMMON project.
*/
const frame = require('../utils/frames.js');
const lz78 = require('../utils/lz78.js');
const Bufferutils = require('../utils/buffers.js');
const protocol_code = 1;
let sleep_time = 10;
let ws_client = null;
let received = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generate_ack(head, ack_num, end = false) {
    let frame_head = {
        dest_ip: head.dest_ip,
        src_ip: head.src_ip,
        src_hostname: head.src_hostname,
        protocol: Bufferutils.int8buffer(protocol_code),
        dest_port: Bufferutils.int16buffer(head.dest_port),
        src_port: Bufferutils.int16buffer(head.src_port),
        seq_num: Bufferutils.int32buffer(head.seq_num),
        ack_num: Bufferutils.int32buffer(ack_num),
        flags: Bufferutils.int8buffer(end ? 3 : 1) // end transmission
    }
    return frame.generate("", frame_head);
}

function generate_frames(data, head) {
    let frames = [];
    data = lz78.to_bin(lz78.encode(data)); // data is now a binary string
    // Data length divided by 986 (max data length)
    for(let i = 0; i < data.length/986; i++) {
        let frame_head = {
            dest_ip: head.dest_ip,
            src_ip: head.src_ip,
            src_hostname: head.src_hostname,
            protocol: Bufferutils.int8buffer(protocol_code),
            dest_port: Bufferutils.int16buffer(head.dest_port),
            src_port: Bufferutils.int16buffer(head.src_port),
            seq_num: Bufferutils.int32buffer(i),
            ack_num: Bufferutils.int32buffer(0),
            flags: Bufferutils.int8buffer((i == Math.ceil(data.length/986 - 1)) ? 2 : 0) // last frame
        }
        frames.push(frame.generate(data.slice(i*986, (i+1)*986), frame_head));
    }
    return frames;
}



async function send(frames) {
    if(ws_client == null) return -1;
    for(i = 0; i < frames.length; i++) {
        ws_client.send(frames[i]);
        let actual_delay = 0;
        while(received == null && actual_delay < sleep_time*1000) {
            await sleep(sleep_time);
            actual_delay += sleep_time;
        }
        received = null;
    }
    return 0;
}

async function send_message(head, message) {
    let frames = generate_frames(message, head);
    await send(frames);
}

function send_ack(head, ack_num) {
    let ack = generate_ack(head, ack_num);
    ws_client.send(ack);
} 

function send_end(head, ack_num) {
    let end = generate_ack(head, ack_num, true);
    ws_client.send(end);
}

function set_ws_client(client) {
    ws_client = client;
    if(ws_client != null) {
        ws_client.on('message', function message(data) {
            received = data;
        });
    }
}

function set_sleep_time(time) {
    sleep_time = time;
}

module.exports = {send_ack, send_end, set_ws_client, send_message, set_sleep_time}