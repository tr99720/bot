import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";

const app = express();
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("OK");
});

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
    // ✅ jiný model (bez beta restriction)
    "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        // ❌ odstraněn OpenAI-Beta header!
      }
    }
  );

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
  });

  openaiWs.on("message", (msg) => {
    const data = JSON.parse(msg);

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

  openaiWs.on("open", () => {
    console.log("🤖 OpenAI connected");

    openaiWs.send(JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["audio"],
        instructions: "Dobrý den, jak vám mohu pomoci?"
      }
    }));
  });

  openaiWs.on("close", (code, reason) => {
    console.log("❌ OpenAI closed:", code, reason?.toString());
  });

  openaiWs.on("error", (err) => {
    console.log("❌ OpenAI error:", err.message);
  });
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});
