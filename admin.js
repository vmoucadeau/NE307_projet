const ws = require('ws');
const immon = require('./protocols/immon.js');
const child_process = require('child_process');
const readline = require('readline');
var colors = require('colors');

//var client = new ws.WebSocket('ws://localhost:8080/');
const showmenu_delay = 1000;
const admin_key = "s3cr3t";
const server_ip = [192,168,1,1];
let server_process = null;
let server_connected = false;
let admin_ip = [0,0,0,0];
let admin_hostname = "unknown";
let clients_list = [];
let clients_process = [];
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


let client;
immon.set_src_info(admin_ip, admin_hostname, 3000);


function spawn_server() {
    console.log('Starting IMMON server');
    const server = child_process.exec('start cmd.exe /K node server.js');

    setTimeout(() => {
        client = new ws.WebSocket('ws://localhost:8080/');
    
        client.on('message', async function(buffer) {
            let parsed = await immon.handle_buffer(buffer);
            if(parsed == null) return;
            switch(parsed.origin) {
                case "IMMON_SRV":
                    switch(parsed.type) {
                        case "SET_IP":
                            admin_ip = parsed.content.split('.').map(x => parseInt(x));
                            immon.set_src_info(admin_ip, admin_hostname, 3000);
                            server_connected = true;
                            // console.log(`\nAdmin IP set to ${admin_ip.join('.')}`);
                            break;
                        case "SET_HOSTNAME":
                            admin_hostname = parsed.content;
                            immon.set_src_info(admin_ip, admin_hostname, 3000);
                            server_connected = true;
                            // console.log(`Admin hostname set to ${parsed.content}`);
                            break;
                        case "CLIENTS_LIST":
                            clients_list = JSON.parse(parsed.content);
                            display_menu();
                            break;
                        case 'KEEP_ALIVE':
                            setTimeout(async() => {
                                await immon.admin_send_message(server_ip, "ALIVE", "");
                            }, 100); // wait for the server to be ready to receive the message
                            break;
                        case "ERROR":
                            console.log(`Error: ${parsed.content}`);
                            break;
                    }
                    break;
                case "IMMON_CLI":
                    console.log(`Client can't send messages to the admin`.yellow);
                    break;
                case "IMMON_ADMIN":
                    console.log(`Admin can't send messages to the admin`.yellow);
                    break;
            }
        });
    
        client.on('open', async function(ws) {
            immon.set_src_info(admin_ip, "admin", 3000);
            immon.set_ws(client);
            await immon.admin_send_message(server_ip, "HEY", admin_key);
            setTimeout(display_menu, showmenu_delay);
        });
        

    }, 2000);


    server.on('close', (code) => {
        client.close();
        server_connected = false;
        clients_list = [];
        admin_ip = [0,0,0,0];
        admin_hostname = "unknown";
        display_menu();
    });
    return server;
}





function spawn_client() {
    if(server_connected == false) {
        console.log('Server is not running');
        return;
    }
    console.log('Creating IMMON client');
    const client = child_process.exec('start cmd.exe /K node client.js');
    client.on('close', (code) => {
        // Get the client id
        let id = -1;
        for(let i = 0; i < clients_process.length; i++) {
            if(clients_process[i].process == client) {
                id = clients_process[i].id;
                break;
            }
        }
        // Remove the client from the list
        for(let i = 0; i < clients_process.length; i++) {
            if(clients_process[i].process == client) {
                clients_process.splice(i, 1);
                break;
            }
        }
        setTimeout(display_menu, showmenu_delay);
    });
    clients_process.push({
        process: client,
        id: clients_process.length
    }); 

}

function choice_client_hostname() {
    console.clear();
    console.log("List of connected clients :".yellow);
    for(let i = 0; i < clients_list.length; i++) {
        console.log(" - " + `Client ${i}`.cyan + " : " + clients_list[i].hostname + " - " + clients_list[i].ip);
    }
    rl.question("Please enter the hostname for the new client (must be unique, max 13 characters : a-z,0-9,-) : ", async(answer) => {
        let patern = /^[a-z0-9-]{1,13}$/;
        if(!patern.test(answer)) {
            console.log("Invalid hostname format.".red);
            setTimeout(choice_client_hostname, showmenu_delay);
            return;
        }
        for(let i = 0; i < clients_list.length; i++) {
            if(clients_list[i].hostname == answer) {
                console.log("Hostname already used".red);
                setTimeout(choice_client_hostname, showmenu_delay);
                return;
            }
        }
        await immon.admin_send_message(server_ip, "NEW_CLI", answer);
        setTimeout(spawn_client, showmenu_delay);
        setTimeout(display_menu, showmenu_delay);
    });
}

function choice_client_delete() {
    console.clear();
    console.log("List of connected clients :".yellow);
    for(let i = 0; i < clients_list.length; i++) {
        console.log(" - " + `Client ${i}`.cyan + " : " + clients_list[i].hostname + " - " + clients_list[i].ip);
    }
    rl.question(`Choose the client to remove (1-${clients_list.length-1}) : `, async(answer) => {
        if(isNaN(answer) || parseInt(answer) < 1 || parseInt(answer) >= clients_list.length) {
            console.log("Invalid choice".red);
            setTimeout(choice_client_delete, showmenu_delay);
            return;
        }
        await immon.admin_send_message(server_ip, "NEW_CLI", answer);
        setTimeout(spawn_client, showmenu_delay);
        setTimeout(display_menu, showmenu_delay);
    });
}

function display_menu() {
    console.clear();
    console.log(" ______  __       __  __       __   ______   __    __         ______         __                __           ");
    console.log("/      |/  \     /  |/  \     /  | /      \ /  \  /  |       /      \       /  |              /  |          ");
    console.log("$$$$$$/ $$  \   /$$ |$$  \   /$$ |/$$$$$$  |$$  \ $$ |         /$$$$$$  |  ____$$ | _____  ____  $$/  _______  ");
    console.log("  $$ |  $$$  \ /$$$ |$$$  \ /$$$ |$$ |  $$ |$$$  \$$ |         $$ |__$$ | /    $$ |/     \/    \ /  |/       \ ");
    console.log("  $$ |  $$$$  /$$$$ |$$$$  /$$$$ |$$ |  $$ |$$$$  $$ |      $$    $$ |/$$$$$$$ |$$$$$$ $$$$  |$$ |$$$$$$$  |");
    console.log("  $$ |  $$ $$ $$/$$ |$$ $$ $$/$$ |$$ |  $$ |$$ $$ $$ |      $$$$$$$$ |$$ |  $$ |$$ | $$ | $$ |$$ |$$ |  $$ |");
    console.log(" _$$ |_ $$ |$$$/ $$ |$$ |$$$/ $$ |$$ \__$$ |$$ |$$$$ |       $$ |  $$ |$$ \__$$  |$$ | $$ | $$ |$$ |$$ |  $$ |");
    console.log("/ $$   |$$ | $/  $$ |$$ | $/  $$ |$$    $$/ $$ | $$$ |      $$ |  $$ |$$    $$ |$$ | $$ | $$ |$$ |$$ |  $$ |");
    console.log("$$$$$$/ $$/      $$/ $$/      $$/  $$$$$$/  $$/   $$/       $$/   $$/  $$$$$$$/ $$/  $$/  $$/ $$/ $$/   $$/ ");
    console.log("");
    console.log("Welcome to the IMMON Admin Console");
    console.log("===================================");
    console.log("Admin IP: ".blue + admin_ip.join('.') + "\nAdmin Hostname: ".blue + admin_hostname);
    console.log("Server status : " + (server_connected == false ? "OFF".red : "ON".green));
    console.log("");
    if(clients_list.length == 0) {
        console.log("No clients connected".yellow);
    }
    else {
        console.log("List of connected clients :".yellow);
        for(let i = 0; i < clients_list.length; i++) {
            console.log(" - " + `Client ${i}`.cyan + " : " + clients_list[i].hostname + " - " + clients_list[i].ip);
        }
    }
    console.log("");
    console.log("Please select an option:");
    if(server_connected == false) {                                                                                      
        console.log('1. Start server');
    }
    else {
        console.log('1. Start server (done)');
    }
    console.log('2. Create a new client');
    console.log('3. Delete client');
    console.log('4. Exit');
    rl.question('Enter your choice: ', (answer) => {
        switch(answer) {
            case '1':
                if(server_connected == false) {
                    server_process = spawn_server();
                }
                else {
                    console.log('Server already running');
                }
                setTimeout(display_menu, showmenu_delay);
                break;
            case '2':
                choice_client_hostname();
                break;
            case '3':
                console.log('Deleting a client');
                setTimeout(display_menu, showmenu_delay);
                break;
            case '4':
                console.log('Exiting');
                process.exit(0);
                break;
            default:
                console.log('Invalid choice');
                setTimeout(display_menu, showmenu_delay);
                break;
        }
        
    });
}

display_menu();