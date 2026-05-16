import express from "express";

const app = express();

app.post("/voice", (req, res) => {

    res.set("Content-Type", "text/xml");

    res.send(`
        <Response>
            <Say voice="Polly.Celine">
                Dobrý den, vítejte. Jak vám mohu pomoci?
            </Say>
        </Response>
    `);
});

app.listen(3000);
