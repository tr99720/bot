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

// ✅ TWIML (Twilio vstup)
app.all("/twiml", (req, res) => {
  res.set("Content-Type", "text/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Stream url="wss://fabulous-fascination-production-185c.up.railway.app/ws"/>
  </Start>
  <Say>Connecting you to the AI assistent</Say>
  <Pause length="60"/>
</Response>`);
});

// ✅ HTTP server
const server = http.createServer(app);

// ✅ WebSocket server (Twilio Media Stream)
const wss = new WebSocketServer({ server });

wss.on("connection", (clientWs) => {
  console.log("✅ Twilio WS připojeno");

  // ✅ OpenAI realtime WS
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
