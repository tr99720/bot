import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";

const app = express();
app.use(express.urlencoded({ extended: true }));

// debug
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// test
app.get("/", (req, res) => {
  res.send("OK");
});

// ✅ Twilio vstup
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

wss.on("connection", (clientWs) => {
  console.log("✅ Twilio WS připojeno");

  let streamSid = null;
  let openaiReady = false;

  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview",
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

    if (data.event === "media" && openaiReady) {
      openaiWs.send(JSON.stringify({
        type: "input_audio_buffer.append",
        audio: data.media.payload
      }));

      // ✅ commit jen občas, ne každé packet!
      openaiWs.send(JSON.stringify({
        type: "input_audio_buffer.commit"
      }));

      openaiWs.send(JSON.stringify({
        type: "response.create",
        response: {
          modalities: ["audio"]
        }
      }));
    }
  });

  // ✅ OpenAI → Twilio
  openaiWs.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "response.audio.delta" && streamSid) {
      clientWs.send(JSON.stringify({
        event: "media",
        streamSid: streamSid,
        media: {
          payload: data.delta
        }
      }));
    }
  });

  // ✅ HLAVNÍ FIX
  openaiWs.on("open", () => {
    console.log("🤖 OpenAI connected");

    // správné nastavení session
    openaiWs.send(JSON.stringify({
      type: "session.update",
      session: {
        input_audio_format: "g711_ulaw",
        output_audio_format: "g711_ulaw",
        voice: "alloy",
        instructions: "Jsi recepční v ordinaci. Mluv česky a pomáhej pacientům."
      }
    }));

    openaiReady = true;

    // ✅ první odpověď (bez čekání)
    setTimeout(() => {
      openaiWs.send(JSON.stringify({
        type: "response.create",
        response: {
          modalities: ["audio"],
          instructions: "Dobrý den, jak vám mohu pomoci?"
        }
      }));
    }, 500);
  });

  openaiWs.on("close", (code, reason) => {
    console.log("❌ OpenAI closed", code, reason?.toString());
  });

  openaiWs.on("error", (err) => {
    console.log("❌ OpenAI error:", err.message);
  });

  clientWs.on("close", () => {
    openaiWs.close();
  });
});

// ✅ PORT
const PORT = 3000;

server.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});
