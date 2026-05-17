import express from "express";
import fs from "fs";

const app = express();
app.use(express.urlencoded({ extended: true }));

const PUBLIC_URL = "https://fabulous-fascination-production-185c.up.railway.app";
const AUDIO_PATH = "/tmp/voice.mp3";

// ✅ AI odpověď
async function askAI(message) {
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        input: `Jsi recepční. Odpověz česky: ${message}`
      })
    });

    const data = await res.json();
    return data.output?.[0]?.content?.[0]?.text || "Nerozumím.";
  } catch (e) {
    console.log("AI error:", e);
    return "Došlo k chybě.";
  }
}

// ✅ ElevenLabs TTS (SAFE verze)
async function generateSpeech(text) {
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech", {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVEN_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2"
      })
    });

    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length > 100) {
      fs.writeFileSync(AUDIO_PATH, buffer);
      return true;
    }

    return false;
  } catch (err) {
    console.log("TTS error:", err);
    return false;
  }
}

// ✅ audio endpoint
app.get("/audio", (req, res) => {
  if (fs.existsSync(AUDIO_PATH)) {
    res.sendFile(AUDIO_PATH);
  } else {
    res.status(404).send("no audio");
  }
});

// ✅ start
app.post("/twiml", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
  /process
    <Say language="cs-CZ">Dobrý den, jak vám mohu pomoci?</Say>
</Response>
  `);
});

// ✅ process
app.post("/process", async (req, res) => {
  const speechText = req.body.SpeechResult;

  console.log("🎤 Uživatel:", speechText);

  const aiResponse = await askAI(speechText || "");

  const ttsOk = await generateSpeech(aiResponse);

  res.type("text/xml");

  // ✅ fallback když TTS selže
  if (!ttsOk) {
    return res.send(`
<Response>
  <Say language="cs-CZ">${aiResponse}</Say>
  /process
</Response>
    `);
  }

  res.send(`
<Response>
  <Play>${PUBLIC_URL}/audio</Play>
  /process
</Response>
  `);
});

// ✅ server
const PORT = 3000;

app.listen(PORT, () => {
  console.log("✅ běží na portu 3000");
});
