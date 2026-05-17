import express from "express";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.urlencoded({ extended: true }));

const PUBLIC_URL = "https://fabulous-fascination-production-185c.up.railway.app";

// ✅ složka pro audio
const AUDIO_PATH = "/tmp/response.mp3";

// ✅ OpenAI text odpověď
async function askAI(message) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      input: `
Jsi recepční v české ordinaci.

Mluv přirozeně česky, krátce a srozumitelně.

Dotaz:
${message}
      `
    })
  });

  const data = await response.json();

  try {
    return data.output[0].content[0].text;
  } catch {
    return "Omlouvám se, zkuste to prosím znovu.";
  }
}

// ✅ OpenAI TTS (český hlas)
async function generateSpeech(text) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "alloy", // ✅ nejlepší dostupný (funguje i na CZ text)
      input: text
    })
  });

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(AUDIO_PATH, Buffer.from(arrayBuffer));
}

// ✅ endpoint pro audio
app.get("/audio", (req, res) => {
  res.sendFile(AUDIO_PATH);
});

// ✅ start hovoru
app.post("/twiml", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
  <Gather input="speech"
          language="cs-CZ"
          speechTimeout="auto"
          timeout="3"
          action="/process">
    <Say language="cs-CZ">Dobrý den, jak vám mohu pomoci?</Say>
  </Gather>

  <Redirect>/twiml</Redirect>
</Response>
  `);
});

// ✅ zpracování řeči
app.post("/process", async (req, res) => {
  const speechText = req.body.SpeechResult;

  console.log("🎤 Uživatel:", speechText);

  let aiResponse = "Nerozumím, zkuste to prosím znovu.";

  if (speechText && speechText.trim() !== "") {
    aiResponse = await askAI(speechText);
  }

  // ✅ vytvoř audio
  await generateSpeech(aiResponse);

  res.type("text/xml");

  res.send(`
<Response>
  <Play>${PUBLIC_URL}/audio</Play>

  <Gather input="speech"
          language="cs-CZ"
          speechTimeout="auto"
          timeout="3"
          action="/process">
    <Say language="cs-CZ">Mohu ještě s něčím pomoci?</Say>
  </Gather>
</Response>
  `);
});

// ✅ server
const PORT = 3000;

app.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});
