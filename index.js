import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/webhook", (req, res) => {
    const message = req.body.Body;

    const reply = "Odpověď: " + message;

    res.set("Content-Type", "text/xml");
    res.send(`
        <Response>
            <Message>${reply}</Message>
        </Response>
    `);
});

app.get("/", (req, res) => {
    res.send("Server běží");
});

app.listen(3000);
