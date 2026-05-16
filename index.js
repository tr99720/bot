import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
app.use(express.urlencoded({ extended: true }));

// ✅ vytvoř HTTP server
const server = http.createServer(app);

// ✅ WebSocket NA STEJNÉM PORTU
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("✅ Twilio connected");

  ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());

    if (data.event === "start") {
      console.log("🎤 Stream started");
    }

    if (data.event === "media") {
      // audio data
    }

    if (data.event === "stop") {
      console.log("🛑 Stream ended");
    }
  });
});

// ✅ TwiML endpoint
app.post("/twiml", (req, res) => {
  console.log("TWIML request");

  res.type("text/xml");
  res.send(`
<Response>
  <Start>
    <Stream url="wss://fabulous-fascination-production-185c.up.railway.app" />
  </Start>
  <Say>Pripojuji vas na AI asistenta</Say>
  <Pause length="60"/>
</Response>
  `);
});

// ✅ důležité: Railway port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server běží na portu " + PORT);
});
