import WebSocket from "ws";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();

// log každého requestu
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// homepage (test)
app.get("/", (req, res) => {
  res.send("OK");
});

// ✅ TWILIO ENDPOINT
app.all("/twiml", (req, res) => {
  console.log("✅ TWIML HIT");

  res.set("Content-Type", "text/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Stream url="wss://fabulous-fascination-production-185c.up.railway.app/ws"/>
  </Start>
  <Say>Pripojuji vas na AI asistenta</Say>
  <Pause length="60"/>
</Response>`);
});

// ✅ HTTP server (nutné pro WebSocket na Railway)
const server = http.createServer(app);

// ✅ WEBSOCKET
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  console.log("✅ Twilio WS připojeno");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.event === "start") {
        console.log("🎤 Stream started");
      }

      if (data.event === "media") {
        // audio data přichází tady (base64)
        // zatím jen ignorujeme
      }

      if (data.event === "stop") {
        console.log("🛑 Stream ended");
      }
    } catch (e) {
      console.log("WS parse error");
    }
  });

  ws.on("close", () => {
    console.log("❌ WS closed");
  });
});

// ✅ PORT (musí být 3000 podle Railway nastavení)
const PORT = 3000;

server.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});
``
