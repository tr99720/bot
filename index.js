const express = require("express");

const app = express();

// ✅ LOG každého requestu (důležité!)
app.use((req, res, next) => {
  console.log("➡️ Request:", req.method, req.url);
  next();
});

// ✅ homepage
app.get("/", (req, res) => {
  console.log("✅ / hit");
  res.status(200).send("OK");
});

// ✅ Twilio endpoint
app.all("/twiml", (req, res) => {
  console.log("✅ /twiml hit");

  res.status(200).type("text/xml").send(`
<Response>
  <Say>Test funguje</Say>
</Response>
  `);
});

// ✅ fallback (když něco jiného zavolá)
app.use((req, res) => {
  console.log("❌ unknown route:", req.url);
  res.status(200).send("fallback");
});

// ✅ port
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("✅ Server listening on port " + PORT);
});
``
