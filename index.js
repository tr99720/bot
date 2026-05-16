import express from "express";

const app = express();
app.use(express.urlencoded({ extended: true }));

// ✅ AI dotaz (text)
async function askAI(message) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: `Jsi recepční v ordinaci. Odpověz česky: ${message}`
    })
  });

  const data = await response.json();
  return data.output[0].content[0].text;
}

// ✅ první krok
app.post("/twiml", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
  <Say>Vítejte, jak vám mohu pomoci?</Say>
  <Gather input="speech" action="/process" method="POST" language="cs-CZ" />
</Response>
  `);
});

// ✅ zpracování řeči
app.post("/process", async (req, res) => {
  const speechText = req.body.SpeechResult;

  console.log("🎤 User said:", speechText);

  let aiResponse = "Nerozumím, zkuste to prosím znovu.";

  if (speechText) {
    try {
      aiResponse = await askAI(speechText);
    } catch (e) {
      console.log("AI error:", e);
    }
  }

  res.type("text/xml");

  res.send(`
<Response>
  <Say>${aiResponse}</Say>
  <Gather input="speech" action="/process" method="POST" language="cs-CZ" />
</Response>
  `);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});
