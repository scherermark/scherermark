require("dotenv").config(); // 8. .env beolvasása
const express = require("express");
const mysql = require("mysql2/promise"); // 8. mysql2/promise importálása

const app = express();
const PORT = process.env.PORT || 3000;

// JSON body feldolgozása
app.use(express.json());

// 8. MySQL Kapcsolati pool (Connection Pool) létrehozása
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "adatbazis_neve",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Teszt végpont (a te meglévő kódod)
app.post("/teszt", (req, res) => {
    console.log(req.body);
    res.json({
        message: "JSON sikeresen megérkezett!",
        data: req.body
    });
});

// ---------------------------------------------------------
// 9. & 10. VÉGPONTOK (SQL lekérdezések, INNER JOIN, hibakezelés)
// ---------------------------------------------------------

// Diákok listázása az osztályuk nevével (INNER JOIN) -> 200 OK
app.get("/diakok", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.id, d.nev, o.nev AS osztaly_nev 
            FROM diakok d 
            INNER JOIN osztalyok o ON d.osztaly_id = o.id
        `);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ hiba: "Szerver hiba történt az adatok lekérésekor." });
    }
});

// Egy diák lekérése ID alapján -> 200 / 400 / 404
app.get("/diakok/:id", async (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return res.status(400).json({ hiba: "Az ID-nak számnak kell lennie!" });
    }

    try {
        // Paraméterezett lekérdezés (?) SQL injection ellen
        const [rows] = await pool.query("SELECT * FROM diakok WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ hiba: "A megadott ID-jú diák nem található." });
        }

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ hiba: "Szerver hiba történt." });
    }
});

// Új diák hozzáadása -> 201 Created / 400 Bad Request / 409 Conflict
app.post("/diakok", async (req, res) => {
    const { nev, osztaly_id } = req.body;

    if (!nev || !osztaly_id) {
        return res.status(400).json({ hiba: "A 'nev' és 'osztaly_id' mezők megadása kötelező!" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO diakok (nev, osztaly_id) VALUES (?, ?)",
            [nev, osztaly_id]
        );
        res.status(201).json({ id: result.insertId, nev, osztaly_id });
    } catch (err) {
        console.error(err);
        // Idegen kulcs / ütközés hiba kezelése (pl. nem létező osztaly_id)
        if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ hiba: "Adatbázis ütközés vagy nem létező osztály ID!" });
        }
        res.status(500).json({ hiba: "Szerver hiba történt a beszúráskor." });
    }
});

// Diák törlése -> 204 No Content / 404 Not Found
app.delete("/diakok/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM diakok WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ hiba: "A törlendő diák nem található." });
        }

        // 204 No Content - sikeres törlés, válasz törzs nélkül
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ hiba: "Szerver hiba történt a törlés során." });
    }
});

// 10. Globális hibakezelő (hogy érvénytelen kéréseknél se omoljon össze a szerver)
app.use((err, req, res, next) => {
    console.error("Váratlan hiba:", err.stack);
    res.status(500).json({ hiba: "Belső szerverhiba történt!" });
});

// Szerver indítása
app.listen(PORT, () => {
    console.log(`Szerver fut: http://localhost:${PORT}`);
});