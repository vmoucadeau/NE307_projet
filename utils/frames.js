/*
    Head data structure:
    {
        dest_ip: [0,0,0,0],
        src_ip: [0,0,0,0],
        src_hostname: "",
        protocol: 0-255,
        dest_port: 0-65535,
        src_port: 0-65535,
        seq_num: 0-4294967295,
        ack_num: 0-4294967295,
        flags: 0 (NONE), 1 (ACK), 2 (FIN) (one byte)
    }
    Head data length: 35 bytes (layers 1 and 2)
    {
        dest_ip: 4 bytes,
        src_ip: 4 bytes,
        src_hostname: 13 bytes,
        protocol: 1 byte,
        dest_port: 2 bytes,
        src_port: 2 bytes,
        seq_num: 4 bytes,
        ack_num: 4 bytes,
        flags: 1 byte,
        offset: 3 bytes
    }
*/

const head_lengths = {
    dest_ip: 4,
    src_ip: 4,
    src_hostname: 13,
    protocol: 1,
    dest_port: 2,
    src_port: 2,
    seq_num: 4,
    ack_num: 4,
    flags: 1,
    offset: 3
}

/*
INPUT: data (bytes), head (object)
OUTPUT: one immon frame (array of 1024 bytes)
*/
function generate(data, head) {
    let buffer = new ArrayBuffer(1024);
    let buffer_vue = new Uint8Array(buffer);
    let buffer_offset = 0;
    for(element in head) {
        Buffer.from(head[element]).copy(buffer_vue, buffer_offset);
        buffer_offset += head_lengths[element];
    }
    buffer_offset += head_lengths["offset"]; // padding
    for(char of data) {
        buffer_vue[buffer_offset] = parseInt(char);
        buffer_offset++;
    }
    let data_str = '';
    for(let i = buffer_offset; i < 1024; i++) {
        data_str += buffer_vue[i].toString();
    }
    return buffer;
}

function parse(buffer) {
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
    let data = buffer_vue.slice(38);
    // convert the data to a string
    let data_str = '';
    for(let i = 0; i < data.length; i++) {
        data_str += data[i].toString();
    }
    return {head: head, data: data_str};
}

module.exports = {generate, parse}