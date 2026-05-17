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

PRAVIDLA:
- mluv česky
- odpovídej krátce (1–2 věty)
- buď přirozený jako člověk na telefonu
- nepoužívej složité formulace

Dotaz:
${message}
      `
    })
  });

  const data = await response.json();

  try {
    return data.output[0].content[0].text;
  } catch {
    return "Omlouvám se, nerozumím. Zkuste to prosím znovu.";
  }
}

// ✅ START hovoru
app.post("/twiml", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
  <Gather 
    input="speech"
    action="/process"
    method="POST"
    language="cs-CZ"
    speechModel="phone_call"
    hints="objednání, termín, doktor, vyšetření, pacient, bolest, kontrola"
    timeout="3"
    speechTimeout="auto"
  >
    <Say language="cs-CZ">Dobrý den, jak vám mohu pomoci?</Say>
  </Gather>

  <!-- fallback -->
  <Redirect>/twiml</Redirect>
</Response>
  `);
});

// ✅ ZPRACOVÁNÍ řeči
app.post("/process", async (req, res) => {
  const speechText = req.body.SpeechResult;

  console.log("🎤 Uživatel:", speechText);

  let aiResponse = "Nerozumím, zkuste to prosím znovu.";

  if (speechText && speechText.trim() !== "") {
    try {
      aiResponse = await askAI(speechText);
    } catch (e) {
