import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";

const app = express();

app.use(express.urlencoded({ extended: true }));

// debug log
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// test
app.get("/", (req, res) => {
  res.send("OK");
});

// ✅ Twilio entry
app.all("/twiml", (req, res) => {
  res.type("text/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Stream url="wss://fabulous-fascination-production-185c.up.railway.app/ws"/>
  </Start>
  <Say>Přepojuji vás na AI asistenta</Say>
  <Pause length="60"/>
</Response>`);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ✅ MAIN WS
wss.on("connection", (clientWs) => {
  console.log("✅ Twilio WS připojeno");

  let streamSid = null;

  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  // ✅ Twilio → OpenAI
  clientWs.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.event === "start") {
      streamSid = data.start.streamSid;
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
  });

  // ✅ OpenAI → Twilio
  openaiWs.on("message", (msg) => {
    const data = JSON.parse(msg);

    // 🔥 audio response
    if (data.type === "response.audio.delta" && streamSid) {
      clientWs.send(JSON.stringify({
        event: "media",
        streamSid,
        media: {
          payload: data.delta
        }
      }));
    }
  });

  // ✅ INIT AI (tady byla chyba předtím!)
  openaiWs.on("open", () => {
    console.log("🤖 OpenAI connected");

    // ✅ správné nastavení session
    openaiWs.send(JSON.stringify({
      type: "session.update",
      session: {
        turn_detection: { type: "server_vad" },
        input_audio_format: "g711_ulaw",
        output_audio_format: "g711_ulaw",
        voice: "alloy",
        instructions: "Jsi recepční v ordinaci. Mluv česky a pomáhej pacientům."
      }
    }));

    // ✅ neodpoví hned — čeká na první řeč (to je správně)
  });

  clientWs.on("close", () => {
    openaiWs.close();
  });

  openaiWs.on("close", () => {
    console.log("❌ OpenAI closed");
  });
});

// ✅ PORT
const PORT = 3000;

server.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});
