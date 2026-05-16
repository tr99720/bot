import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: process.env.PORT || 3000 });

console.log("WS server ready");

wss.on("connection", (ws, req) => {
  console.log("Twilio connected");

  ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());

    if (data.event === "start") {
      console.log("Stream started");
    }

    if (data.event === "media") {
      // zde chodí audio (base64)
      // zatím jen log
    }

    if (data.event === "stop") {
      console.log("Stream ended");
    }
  });
});
