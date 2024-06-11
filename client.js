const ws = require('ws');
const immon = require('./protocols/immon.js');
var colors = require('colors');
const readline = require('readline');
let client = new ws.WebSocket('ws://localhost:8080/');
let client_ip = [0,0,0,0]; // default value (should be changed by the server)
let server_ip = [192,168,1,1];
let client_hostname = "unknown" // default value (should be changed by the server)
let clients_list = [];

client.on('error', function(error) {
    console.log('Connect Error: ' + error.toString());
});


let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


client.on('message', async function(buffer) {
    let parsed = await immon.handle_buffer(buffer);
    if(parsed == null) return;
    let head = parsed.head;
    parsed = {origin: parsed.origin, type: parsed.type, content: parsed.content}; // remove the head from the parsed message
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
                case "CLIENTS_LIST":
                    clients_list = JSON.parse(parsed.content);
                    console.log("List of connected clients :".yellow);
                    for(let i = 0; i < clients_list.length; i++) {
                        console.log(" - " + `Client ${i}`.cyan + " : " + clients_list[i].hostname + " - " + clients_list[i].ip);
                    }
                    break;
                case 'KEEP_ALIVE':
                    setTimeout(async function() {
                        await immon.cli_send_message(server_ip, "ALIVE", "");
                    }, 100);
                    break;
            }
            break;
        case "IMMON_CLI":
            switch(parsed.type) {
                case "MESSAGE":
                    console.log(head);
                    var str_src_hostname = new TextDecoder().decode(head.src_hostname);
                    var str_src_ip = Array.from(head.src_ip).join('.');
                    console.log(`Message from ` + `${str_src_hostname} `.cyan + `(${str_src_ip})`.red + ` : ${parsed.content}`);
                    break;
            }
            break;
        case "IMMON_ADMIN":
            console.log(`Admin can't send messages to clients`);
    }
});

client.on('open', async function(ws) {
    console.log("Use <hostname>:message to send a message to a client".green);
    immon.set_src_info(client_ip, client_hostname, 3000);
    immon.set_ws(client);
    await immon.cli_send_message(server_ip, "HEY", "");
});

function displayInterface() {
    rl.question("", async function(answer) {
        let split = answer.split(":");
        if(split.length < 2) {
            console.log("Invalid command".red);
            displayInterface();
            return;
        }
        let hostname = split[0];
        let message = split.slice(1).join(":");
        let client = clients_list.find(x => x.hostname == hostname);
        if(client == undefined) {
            console.log("Client not found".red);
            displayInterface();
            return;
        }
        await immon.cli_send_message(client.ip.split('.').map(x => parseInt(x)), "MESSAGE", message);
        displayInterface();
    });
}

displayInterface();