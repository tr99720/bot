import express from "express";
import fs from "fs";

const app = express();
app.use(express.urlencoded({ extended: true }));

const PUBLIC_URL = "https://fabulous-fascination-production-185c.up.railway.app";
const AUDIO_PATH = "/tmp/voice.mp3";

// ✅ OpenAI odpověď
async function askAI(message) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      input: `
Jsi recepční v české ordinaci.
Mluv přirozeně česky, krátce.

Dotaz:
${message}
      `
    })
  });

  const data = await res.json();

  try {
    return data.output[0].content[0].text;
  } catch {
    return "Omlouvám se, zkuste to prosím znovu.";
  }
}

// ✅ ElevenLabs TTS
async function generateSpeech(text) {
  const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL", {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVEN_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8
      }
    })
  });

  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(AUDIO_PATH, Buffer.from(arrayBuffer));
}

// ✅ audio endpoint
app.get("/audio", (req, res) => {
  res.sendFile(AUDIO_PATH);
});

// ✅ start
app.post("/twiml", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
  /process
    <Say language="cs-CZ">Dobrý den, jak vám mohu pomoci?</Say>
  </Gather>
</Response>
  `);
});

// ✅ process
app.post("/process", async (req, res) => {
  const speechText = req.body.SpeechResult;

  console.log("🎤:", speechText);

  let aiResponse = "Nerozumím.";

  if (speechText) {
    aiResponse = await askAI(speechText);
  }

  await generateSpeech(aiResponse);

  res.type("text/xml");

  res.send(`
<Response>
  <Play>${PUBLIC_URL}/audio</Play>

  /process
    <Say language="cs-CZ">Mohu ještě pomoci?</Say>
  </Gather>
</Response>
  `);
});

const PORT = 3000;
app.listen(PORT, () => console.log("✅ běží na 3000"));
