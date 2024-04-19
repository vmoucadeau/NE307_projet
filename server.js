const ws = require('ws');




const wss = new ws.WebSocketServer({
  port: 8080,
});

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log('Received: %s', message);
        ws.send(`Hello, you sent -> ${message}`);
    });
    
    ws.send('Hi there, I am a WebSocket server');
});