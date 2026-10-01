const express = require("express");

const app = express();
const PORT = 3000;

// JSON body feldolgozása
app.use(express.json());

// Teszt végpont
app.post("/teszt", (req, res) => {
    console.log(req.body);

    res.json({
        message: "JSON sikeresen megérkezett!",
        data: req.body
    });
});

// Szerver indítása
app.listen(PORT, () => {
    console.log(`Szerver fut: http://localhost:${PORT}`);
});