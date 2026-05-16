import express from "express";

const app = express();

// krytí POST dat od Twilio
app.use(express.urlencoded({ extended: true }));

// 🔥 TEST endpoint
app.post("/twiml", (req, res) => {
  console.log("TWIML REQUEST OK");

  res.set("Content-Type", "text/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Test funguje</Say>
</Response>`);
});

// test homepage
app.get("/", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server běží na portu " + PORT);
});
