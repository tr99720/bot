import express from "express";

const app = express();

app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.send("OK");
});

app.all("/twiml", (req, res) => {
  res.set("Content-Type", "text/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Test funguje</Say>
</Response>`);
});

// 👇 natvrdo správný port
const PORT = 3000;

app.listen(PORT, () => {
  console.log("✅ Server běží na portu " + PORT);
});
