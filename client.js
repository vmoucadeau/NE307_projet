const ws = require('ws');
const frame = require('./utils/frames.js');
const Buffutils = require('./utils/buffers.js');
const lz78 = require('./utils/lz78.js');
const etcp = require('./protocols/etcp.js'); // eTCP protocol is used for this client


let client = new ws.WebSocket('ws://localhost:8080/');
let client_ip = [192,168,1,0]; // default value (should be changed by the server)
let server_ip = [192,168,1,1];
let client_hostname = "unknown" // default value (should be changed by the server)


client.on('error', function(error) {
    console.log('Connect Error: ' + error.toString());
});

let received = null;


client.on('open', async function(connection) {
    // let data = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Quisque non dui eros. Cras ac nisl et massa blandit cursus a id dolor. Fusce aliquet nec odio ac suscipit. Nullam et egestas turpis. Quisque a arcu ut purus ornare eleifend. Nulla facilisi. Donec efficitur, erat eget fermentum ornare, ligula velit elementum ipsum, ac auctor nulla odio vel libero. Aliquam dolor ante, pellentesque ut consectetur et, gravida eu neque. Duis vitae aliquam diam. Aenean eget convallis sem, vel suscipit eros. Nam aliquam volutpat varius. Vestibulum sit amet purus imperdiet, vulputate lorem et, tempus sapien. Curabitur at lacinia diam. Vivamus ac neque sem. Ma.";
    let data = "IMMON_CLI:HELLO:world:coucou";
    etcp.set_ws_client(client);
    await etcp.send_message({
        dest_ip: server_ip,
        src_ip: client_ip,
        src_hostname: client_hostname,
        protocol: 1,
        dest_port: 8080,
        src_port: 8080
    }, data);
    
    process.exit();
});
