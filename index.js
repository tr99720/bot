import express from "express";

const app = express();
app.use(express.urlencoded({ extended: true }));

// ✅ volání OpenAI
async function askAI(message) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o", // ✅ lepší čeština
      input: `
Jsi profesionální recepční v české ordinaci.

Mluv přirozeně česky, krátce a srozumitelně.
Používej jednoduché věty jako člověk na telefonu.

Otázka pacienta:
${message}
      `
    })
  });

  const data = await response.json();

  // bezpečný návrat
  try {
    return data.output[0].content[0].text;
  } catch {
    return "Omlouvám se, došlo k chybě. Zkuste to prosím znovu.";
  }
}

// ✅ vstupní endpoint
app.post("/twiml", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
  <Say>Vítejte, jak vám mohu pomoci?</Say>
  <Gather input="speech" timeout="3" speechTimeout="auto"
          action="/process" method="POST" language="cs-CZ" />
  <Redirect>/twiml</Redirect>
</Response>
  `);
});

// ✅ zpracování řeči
app.post("/process", async (req, res) => {
  const speechText = req.body.SpeechResult;

  console.log("🎤 Uživatel řekl:", speechText);

  let aiResponse = "Nerozumím, zkuste to prosím znovu.";

  if (speechText) {
    try {
      aiResponse = await askAI(speechText);
    } catch (e) {
      console.log("AI error:", e.message);
    }
  }

  res.type("text/xml");

  res.send(`
<Response>
  <Say>Okamžik prosím.</Say>
  <Pause length="1"/>
  <Say>${aiResponse}</Say>

  <Gather input="speech" timeout="3" speechTimeout="auto"
          action="/process" method="POST" language="cs-CZ" />
</Response>
  `);
});

// ✅ server
const PORT = 3000;

app.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});
