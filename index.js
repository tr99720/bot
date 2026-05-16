import express from "express";

const app = express();

// test homepage
app.get("/", (req, res) => {
  res.send("OK");
});

// Twilio endpoint
app.all("/twiml", (req, res) => {
  res.set("Content-Type", "text/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Test funguje</Say>
</Response>`);
});

// ✅ KRITICKÉ pro Railway
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("Server běží na portu " + PORT);
});
