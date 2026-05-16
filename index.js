import express from "express";

const app = express();

// důležité pro Twilio ↓↓↓
app.use(express.urlencoded({ extended: true }));

app.post("/voice", (req, res) => {
    console.log("CALL RECEIVED"); // uvidíš v logu

    res.type("text/xml");

    res.send(`
<Response>
    <Say voice="alice" language="cs-CZ">
        Dobrý den. Tohle je testovací hlasový chatbot.
    </Say>
</Response>
    `);
});

// test endpoint
app.get("/", (req, res) => {
    res.send("Server běží");
});

// ✅ důležité pro Railway!
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server běží na portu " + PORT);
});
