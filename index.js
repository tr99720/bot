import express from "express";

const app = express();

// Twilio posílá data jako form-urlencoded
app.use(express.urlencoded({ extended: true }));

// ✅ homepage test
app.get("/", (req, res) => {
  res.send("OK");
});

// ✅ TWIML endpoint (funguje pro GET i POST)
app.all("/twiml", (req, res) => {
  console.log("✅ TWIML REQUEST PŘIŠEL");

  res.set("Content-Type", "text/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Test funguje</Say>
</Response>`);
});

// ✅ Railway musí poslouchat na tomhle portu
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});
