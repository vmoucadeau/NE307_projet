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
        flags: 1 byte
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
    flags: 1
}

/*
INPUT: data (bytes), head (object)
OUTPUT: one immon frame (array of 1024 bytes)
*/
function generate_data_frame(data, head) {
    let buffer = new ArrayBuffer(1024);
    let buffer_vue = new Uint8Array(buffer);
    let buffer_offset = 0;
    let data_len = data.length;
    for(element in head) {
        Buffer.from(head[element]).copy(buffer_vue, buffer_offset);
        buffer_offset += head_lengths[element];
    }
    buffer_offset += 13;
    return buffer;
}

module.exports = {generate_data_frame}