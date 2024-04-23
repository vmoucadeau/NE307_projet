const ws = require('ws');
const child_process = require('child_process');
const readline = require('readline');

//var client = new ws.WebSocket('ws://localhost:8080/');
const showmenu_delay = 750;
let server_process = null;
let client_list = [];
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function spawn_server() {
    console.log('Starting IMMON server');
    const server = child_process.exec('start cmd.exe /K node server.js');
    server.on('close', (code) => {
        console.log(`\nServer process exited with code ${code}`);
        server_process = null;
        setTimeout(display_menu, showmenu_delay);
    });
    return server;
}


function spawn_client() {
    if(server_process == null) {
        console.log('Server is not running');
        return;
    }
    console.log('Creating IMMON client');
    const client = child_process.exec('start cmd.exe /K node client.js');
    client.on('close', (code) => {
        // Get the client id
        let id = -1;
        for(let i = 0; i < client_list.length; i++) {
            if(client_list[i].process == client) {
                id = client_list[i].id;
                break;
            }
        }
        console.log(`\nClient ${id} exited with code ${code}`);
        // Remove the client from the list
        for(let i = 0; i < client_list.length; i++) {
            if(client_list[i].process == client) {
                client_list.splice(i, 1);
                break;
            }
        }
        setTimeout(display_menu, showmenu_delay);
    });
    client_list.push({
        process: client,
        id: client_list.length
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
    console.log("");
    console.log("Please select an option:");
    if(server_process == null) {                                                                                      
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
                if(server_process == null) {
                    server_process = spawn_server();
                }
                else {
                    console.log('Server already running');
                }
                break;
            case '2':
                spawn_client();
                break;
            case '3':
                console.log('Deleting a client');
                break;
            case '4':
                console.log('Exiting');
                process.exit(0);
                break;
            default:
                console.log('Invalid choice');
                break;
        }
        setTimeout(display_menu, showmenu_delay);
    });
}

display_menu();