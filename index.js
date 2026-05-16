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

app.get("/", (req, res) => {
  res.send("OK");
});

// ✅ Twilio start
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

  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
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
      // posíláme audio
      openaiWs.send(JSON.stringify({
        type: "input_audio_buffer.append",
        audio: data.media.payload
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

  // ✅ INIT AI
  openaiWs.on("open", () => {
    console.log("🤖 OpenAI connected");

    // nastavení
    openaiWs.send(JSON.stringify({
      type: "session.update",
      session: {
        turn_detection: { type: "server_vad" },
        input_audio_format: "g711_ulaw",
        output_audio_format: "g711_ulaw",
        voice: "alloy",
        instructions:
          "Jsi recepční v ordinaci. Mluv česky a pomáhej pacientům objednat se."
      }
    }));

    // 🔥 KRITICKÉ — po krátkém čase vynutit odpověď
    setTimeout(() => {
      openaiWs.send(JSON.stringify({
        type: "input_audio_buffer.commit"
      }));

      openaiWs.send(JSON.stringify({
        type: "response.create",
        response: {
          modalities: ["audio"],
          instructions: "Pozdrav a zeptej se, jak můžeš pomoci."
        }
      }));
    }, 1000);
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
``
