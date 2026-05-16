import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: process.env.PORT || 3000 });

console.log("WebSocket server běží");

wss.on('connection', function connection(ws) {
  console.log("Twilio connected");

  ws.on('message', function message(data) {
    const msg = data.toString();
    console.log("Received:", msg);

    // jednoduchá odpověď (text event)
    ws.send(JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["text"],
        instructions: "Dobrý den, jsem hlasový asistent. Jak vám mohu pomoci?"
      }
    }));
  });

  ws.on('close', () => {
    console.log("Connection closed");
  });
});
