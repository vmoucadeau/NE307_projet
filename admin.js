const ws = require('ws');
const child_process = require('child_process');

//var client = new ws.WebSocket('ws://localhost:8080/');
let server_process = null;
function spawn_server() {
    console.log('[ADMIN] : Starting IMMON server');
    const server = child_process.exec('start cmd.exe /K node server.js');
    server.stdout.on('data', (data) => {
        console.log(`[SERVER INFO]: ${data}`);
    });
    server.stderr.on('data', (data) => {
        console.log(`[SERVER ERROR]: ${data}`);
    });
    server.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
    });
    return server;
}

function kill_server() {
    if(server_process == null) {
        console.log('[ADMIN] : Server not running');
        return;
    }
    console.log('[ADMIN] : Stopping IMMON server');
    server_process.kill();
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
    console.log('1. Start server');
    console.log('2. Stop server');
    console.log('3. Create a new client');
    console.log('4. Delete client');
    console.log('5. Exit');
}

display_menu();