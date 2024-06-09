/*
    IMMON Application Protocol
    Built on top of eTCP
*/

const etcp = require('./etcp.js');
const frames = require('../utils/frames.js');
const lz78 = require('../utils/lz78.js');

const head = {
    dest_ip: [192,168,1,1],
    src_ip: [192,168,1,0],
    src_hostname: "unknown",
    src_port: 8080,
    dest_port: 8080,
    protocol: 1,
}

let received = "";
let ack = 0;


async function cli_send_message(dest_ip, type, content) {
    head.dest_ip = dest_ip;
    await etcp.send_message(head, "IMMON_CLI:" + type + ":" + content);
}

async function admin_send_message(dest_ip, type, content) {
    head.dest_ip = dest_ip;
    await etcp.send_message(head, "IMMON_ADMIN:" + type + ":" + content);
}

async function srv_send_message(dest_ip, type, content) {
    head.dest_ip = dest_ip;
    await etcp.send_message(head, "IMMON_SRV:" + type + ":" + content);
}

async function parse_message(message) {
    let split = message.split(":");
    if(split.length < 3) return null;
    let origin = split[0];
    let type = split[1];
    split = split.slice(2);
    let content = split.join(":").replaceAll('\x00', "");
    return {origin, type, content};
}

async function handle_buffer(buffer) {
    let parsed = frames.parse(buffer);
    let head = parsed.head;
    let data = parsed.data;
    received += data;
    if(head.flags == 0) {
        await etcp.send_ack(head, ack);
        ack += 1;
        return ack;
    }
    if(head.flags == 2) {
        await etcp.send_end(head, ack);
        let decoded = lz78.decode(lz78.to_dic(received));
        received = "";
        ack = 0;
        return parse_message(decoded);
    }
    if(head.flags == 3) {
        received = "";
        ack = 0;
        return 0;
    }
}

function set_src_info(src_ip, src_hostname, src_port) {
    head.src_ip = src_ip;
    head.src_hostname = src_hostname;
    head.src_port = src_port;
}

function set_dest_port(dest_port) {
    head.dest_port = dest_port;
}

function set_ws(client) {
    etcp.set_ws_client(client);
}

module.exports = {cli_send_message, admin_send_message, srv_send_message, handle_buffer, set_src_info, set_dest_port, set_ws}