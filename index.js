import express from "express";
import fs from "fs";

const app = express();
app.use(express.urlencoded({ extended: true }));

const PUBLIC_URL = "https://fabulous-fascination-production-185c.up.railway.app";
const AUDIO_PATH = "/tmp/voice.mp3";

// ✅ OPENAI (text odpověď)
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
        input: `Jsi recepční v ordinaci. Odpověz česky stručně: ${message}`
      })
    });

    const data = await res.json();
    return data.output?.[0]?.content?.[0]?.text || "Nerozumím.";
  } catch (e) {
    console.log("❌ OpenAI error:", e.message);
    return "Došlo k chybě, zkuste to prosím znovu.";
  }
}

// ✅ ELEVENLABS (správně s voiceId)
async function generateSpeech(text) {
  try {
    if (!process.env.ELEVEN_API_KEY) {
      console.log("⚠️ chybí ELEVEN_API_KEY");
      return false;
    }

    // ✅ veřejně funkční voiceId (můžeš později změnit)
    const voiceId = "EXAVITQu4vr4xnSDxMaL";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128"
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.log("❌ ElevenLabs error:", err);
      return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length < 100) {
      console.log("❌ prázdné audio");
      return false;
    }

    fs.writeFileSync(AUDIO_PATH, buffer);
    return true;

  } catch (err) {
    console.log("❌ TTS error:", err.message);
    return false;
  }
}

// ✅ AUDIO endpoint
app.get("/audio", (req, res) => {
  if (fs.existsSync(AUDIO_PATH)) {
    res.sendFile(AUDIO_PATH);
  } else {
    res.status(404).send("no audio yet");
  }
});

// ✅ START hovoru
app.post("/twiml", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
  <Gather input="speech" language="cs-CZ" timeout="3" speechTimeout="auto" action="/process">
    <Say>Dobrý den, jak vám mohu pomoci?</Say>
  </Gather>

  <Redirect>/twiml</Redirect>
</Response>
  `);
});

// ✅ PROCESS
app.post("/process", async (req, res) => {
  const speechText = req.body.SpeechResult;

  console.log("🎤 Uživatel řekl:", speechText);

  const aiResponse = await askAI(speechText || "");

  const ok = await generateSpeech(aiResponse);

  res.type("text/xml");

  // ✅ fallback když TTS nefunguje
  if (!ok) {
    return res.send(`
<Response>
  <Say language="cs-CZ">${aiResponse}</Say>
  <Redirect>/twiml</Redirect>
</Response>
    `);
  }

  res.send(`
<Response>
  <Play>${PUBLIC_URL}/audio</Play>
  <Redirect>/twiml</Redirect>
</Response>
  `);
});

// ✅ SERVER
const PORT = 3000;

app.listen(PORT, () => {
  console.log("✅ Server běží na portu", PORT);
});
