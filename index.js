import express from "express";
import { WebSocketServer } from "ws";

const app = express();

// ✅ důležité pro POST z Twilio
app.use(express.urlencoded({ extended: true }));

// ✅ TwiML endpoint
app.post("/twiml", (req, res) => {
  console.log("TWIML request received");

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

// ✅ WebSocket server
const wss = new WebSocketServer({ port: process.env.PORT || 3000 });

wss.on("connection", (ws) => {
  console.log("✅ Twilio connected");

  ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());

    if (data.event === "start") {
      console.log("🎤 Stream started");
    }

    if (data.event === "media") {
      // sem chodí audio
    }

    if (data.event === "stop") {
      console.log("🛑 Stream ended");
    }
  });
});

// ✅ HTTP server (musí zůstat)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server běží na portu " + PORT);
});
