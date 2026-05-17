import express from "express";

const app = express();
app.use(express.urlencoded({ extended: true }));

// ✅ OpenAI
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
Jsi profesionální recepční v české ordinaci.

Mluv přirozeně česky, krátce a srozumitelně.
Používej jednoduché věty jako člověk na telefonu.

Otázka:
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

// ✅ START
app.post("/twiml", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
  <Say language="cs-CZ">Dobrý den, jak vám mohu pomoci?</Say>

  <Gather 
    input="speech" 
    action="/process" 
    method="POST"
    language="cs-CZ"
    speechTimeout="auto"
    timeout="3">
  </Gather>
</Response>
  `);
});

// ✅ ZPRACOVÁNÍ
app.post("/process", async (req, res) => {
  const speechText = req.body.SpeechResult;

  console.log("🎤 Uživatel:", speechText);

  let aiResponse = "Nerozumím, zkuste to prosím znovu.";

  if (speechText) {
    aiResponse = await askAI(speechText);
  }

  res.type("text/xml");

  res.send(`
<Response>
  <Say language="cs-CZ">Okamžik prosím.</Say>
  <Pause length="1"/>
  <Say language="cs-CZ">${aiResponse}</Say>

  <Gather 
    input="speech" 
    action="/process" 
    method="POST"
    language="cs-CZ"
    speechTimeout="auto"
    timeout="3">
  </Gather>
</Response>
  `);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});
