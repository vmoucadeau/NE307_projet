const ws = require('ws');
const immon = require('./protocols/immon.js');

let client = new ws.WebSocket('ws://localhost:8080/');
let client_ip = [0,0,0,0]; // default value (should be changed by the server)
let server_ip = [192,168,1,1];
let client_hostname = "unknown" // default value (should be changed by the server)


client.on('error', function(error) {
    console.log('Connect Error: ' + error.toString());
});

let received = null;


client.on('message', async function(buffer) {
    let parsed = await immon.handle_buffer(buffer);
    if(parsed == null) return;
    switch(parsed.origin) {
        case "IMMON_SRV":
            switch(parsed.type) {
                case "SET_IP":
                    client_ip = parsed.content.split('.').map(x => parseInt(x));
                    immon.set_src_info(client_ip, client_hostname, 4000);
                    console.log(`Client IP set to ${client_ip.join('.')}`);
                    break;
                case "SET_HOSTNAME":
                    client_hostname = parsed.content;
                    immon.set_src_info(client_ip, client_hostname, 4000);
                    console.log(`Client hostname set to ${parsed.content}`);
                    break;
                case "ERROR":
                    console.log(`Error: ${parsed.content}`);
                    break;
            }
            break;
        case "IMMON_CLI":
            console.log(`Client message received: ${parsed.content}`);
        case "IMMON_ADMIN":
            console.log(`Admin can't send messages to clients`);
    }
});

client.on('open', async function(ws) {
    immon.set_src_info(client_ip, client_hostname, 3000);
    immon.set_ws(client);
    await immon.cli_send_message(server_ip, "HEY", "");
});
