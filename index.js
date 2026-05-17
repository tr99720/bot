import express from "express";

const app = express();
app.use(express.urlencoded({ extended: true }));

// ✅ OPENAI - učitel angličtiny
async function askAI(message) {
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `
You are an English teacher for speaking practice.

Rules:
- Speak simple, clear English
- Keep responses short (1–2 sentences)
- Ask follow-up questions
- If the user makes a mistake, gently correct it

User said:
${message}
        `
      })
    });

    const data = await res.json();
    return data.output?.[0]?.content?.[0]?.text || "Can you repeat that?";
  } catch (e) {
    console.log("AI error:", e);
    return "Sorry, something went wrong.";
  }
}

// ✅ START
app.post("/twiml", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
  <Say>Hi! I am your English teacher. Let's practice speaking.</Say>

  <Gather input="speech"
          action="/process"
          method="POST"
          language="en-US"
          speechTimeout="auto"
          timeout="3">
  </Gather>
</Response>
  `);
});

// ✅ PROCESS
app.post("/process", async (req, res) => {
  const speechText = req.body.SpeechResult;

  console.log("User:", speechText);

  let aiResponse = "I didn't understand. Can you try again?";

  if (speechText && speechText.trim() !== "") {
    aiResponse = await askAI(speechText);
  }

  res.type("text/xml");

  res.send(`
<Response>
  <Say>${aiResponse}</Say>

  <Gather input="speech"
          action="/process"
          method="POST"
          language="en-US"
          speechTimeout="auto"
          timeout="3">
  </Gather>
</Response>
  `);
});

// ✅ SERVER
const PORT = 3000;

app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
