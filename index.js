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

// test homepage
app.get("/", (req, res) => {
  res.send("OK");
});

// ✅ TWIML (Twilio call → stream)
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

// ✅ WebSocket server (Twilio)
const wss = new WebSocketServer({ server });

wss.on("connection", (clientWs) => {
  console.log("✅ Twilio WS připojeno");

  // ✅ OpenAI realtime
  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
    {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  // 👉 Twilio → OpenAI
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

  // 👉 OpenAI → Twilio (audio reply)
  openaiWs.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      // audio stream zpět
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

  // ✅ INIT AI
  openaiWs.on("open", () => {
    console.log("🤖 OpenAI připojeno");

    // 🔥 nastavení audio + chování
    openaiWs.send(JSON.stringify({
      type: "session.update",
      session: {
        turn_detection: { type: "server_vad" },
        input_audio_format: "g711_ulaw",
        output_audio_format: "g711_ulaw",
        voice: "alloy",
        instructions:
          "Jsi recepční v ordinaci. Mluv česky, buď stručný a pomáhej pacientům objednat se."
      }
    }));

    // 🔥 první odpověď
    openaiWs.send(JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["audio"],
        instructions: "Pozdrav a zeptej se, jak můžeš pomoci."
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

// ✅ PORT (musí být 3000)
const PORT = 3000;

server.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});
