import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";

const app = express();

// log requestů
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// homepage
app.get("/", (req, res) => {
  res.send("OK");
});

// ✅ Twilio endpoint
app.all("/twiml", (req, res) => {
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

// HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (clientWs) => {
  console.log("✅ Twilio WS připojeno");

  // OpenAI WS
  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
    {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  // Twilio → OpenAI
  clientWs.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.event === "start") {
        console.log("🎤 Stream started");
      }

      if (data.event === "media") {
        openaiWs.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: data.media.payload
        }));
      }

      if (data.event === "stop") {
        console.log("🛑 Stream ended");
      }
    } catch (e) {
      console.log("parse error");
    }
  });

  // OpenAI → Twilio
  openaiWs.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.type === "response.audio.delta") {
        clientWs.send(JSON.stringify({
          event: "media",
          media: {
            payload: data.delta
          }
        }));
      }
    } catch (e) {}
  });

  openaiWs.on("open", () => {
    console.log("🤖 OpenAI připojeno");

    openaiWs.send(JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["audio"],
        instructions: "Jsi recepční v ordinaci. Mluv česky a pomáhej pacientům objednat se."
      }
    }));
  });

  openaiWs.on("close", () => {
    console.log("❌ OpenAI zavřeno");
  });

  clientWs.on("close", () => {
    openaiWs.close();
  });
});

// ✅ důležité – port
const PORT = 3000;

server.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});

