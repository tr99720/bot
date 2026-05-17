import express from "express";

const app = express();
app.use(express.urlencoded({ extended: true }));

// ✅ AI – English teacher (rychlá verze)
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
You are an English speaking teacher for phone conversation practice.

VERY IMPORTANT:
- Answer in MAX 1 short sentence
- Speak fast and naturally
- Always ask a follow-up question
- If the user makes a mistake, gently correct it

User said:
${message}
        `
      })
    });

    const data = await res.json();
    return data.output?.[0]?.content?.[0]?.text || "Can you repeat that?";
  } catch (e) {
    console.log("AI error:", e.message);
    return "Sorry, something went wrong.";
  }
}

// ✅ START
app.post("/twiml", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
  <Say voice="Polly.Joanna">Hi! I am your English teacher. Let's practice speaking.</Say>

  <Gather 
    input="speech" 
    action="/process" 
    method="POST"
    timeout="1"
    speechTimeout="auto"
    language="en-US"
  >
  </Gather>
</Response>
  `);
});

// ✅ PROCESS
app.post("/process", async (req, res) => {
  const speechText = req.body.SpeechResult;

  console.log("User said:", speechText);

  let aiResponse = "I didn't catch that. Can you repeat?";

  if (speechText && speechText.trim() !== "") {
    aiResponse = await askAI(speechText);
  }

  res.type("text/xml");

  res.send(`
<Response>
  <Say voice="Polly.Joanna">${aiResponse}</Say>

  <Gather 
    input="speech" 
    action="/process" 
    method="POST"
    timeout="1"
    speechTimeout="auto"
    language="en-US"
  >
  </Gather>
</Response>
  `);
});

// ✅ SERVER
const PORT = 3000;

app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
