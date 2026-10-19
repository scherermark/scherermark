require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const app = express();
const PORT = process.env.PORT || 3000;
 
app.use(express.json());
 
 
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
 
});
 
 
app.get("/", (req, res) => {
    res.json({
        uzenet: "Kezdő Iskolai REST API fut",
        elerheto_vegpontok: [
            "GET /api/osztalyok",
            "GET /api/osztalyok/:id",
            "GET /api/osztalyok/:id/diakok",
            "GET /api/diakok",
            "GET /api/diakok/:id",
            "GET /api/diakok?aktiv=1"
        ]
    });
});
 
 
app.get("/api/osztalyok", async (req, res) => {
    try {
        const [sorok] = await pool.query(
            "SELECT id, nev, szak, evfolyam FROM osztalyok ORDER BY id"
        );
        res.status(200).json(sorok);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Hiba az adatok olvasásakor", reszletek: error.message });
    }
});
 
 
app.get("/api/osztalyok/:id", async (req, res) => {
    try {
        if (!ervenyesId(req.params.id)) {
            return res.status(400).json({ error: "Érvénytelen azonosító" });
        }
 
        const [sorok] = await pool.execute(
            "SELECT id, nev, szak, evfolyam FROM osztalyok WHERE id = ?",
            [Number(req.params.id)]
        );
 
        if (sorok.length === 0) {
            return res.status(404).json({ error: "Osztály nem található" });
        }
 
        res.status(200).json(sorok[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Hiba az adatok olvasásakor", reszletek: error.message });
    }
});
 
 
app.get("/api/osztalyok/:id/diakok", async (req, res) => {
    try {
        if (!ervenyesId(req.params.id)) {
            return res.status(400).json({ error: "Érvénytelen azonosító" });
        }
 
        const id = Number(req.params.id);
 
        const [osztalyok] = await pool.execute(
            "SELECT id FROM osztalyok WHERE id = ?",
            [id]
        );
 
        if (osztalyok.length === 0) {
            return res.status(404).json({ error: "Osztály nem található" });
        }
 
        const [diakok] = await pool.execute(
            "SELECT id, nev, email, aktiv, osztaly_id FROM diakok WHERE osztaly_id = ? ORDER BY id",
            [id]
        );
 
        res.status(200).json(diakok);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Hiba az adatok olvasásakor", reszletek: error.message });
    }
});
 
app.get("/api/diakok", async (req, res) => {
    try {
        let sql = `
            SELECT d.id, d.nev, d.email, d.aktiv, d.osztaly_id,
                   o.nev AS osztalyNev
            FROM diakok d
            INNER JOIN osztalyok o ON d.osztaly_id = o.id`;
        const parameterek = [];
 
        if (req.query.aktiv !== undefined) {
            if (req.query.aktiv !== "0" && req.query.aktiv !== "1") {
                return res.status(400).json({
                    error: "Az aktiv értéke csak 0 vagy 1 lehet"
                });
            }
            sql += " WHERE d.aktiv = ?";
            parameterek.push(Number(req.query.aktiv));
        }
 
        sql += " ORDER BY d.id";
 
        const [sorok] = await pool.execute(sql, parameterek);
        res.status(200).json(sorok);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Hiba az adatok olvasásakor", reszletek: error.message });
    }
});
 
app.get("/api/diakok/:id", async (req, res) => {
    try {
        if (!ervenyesId(req.params.id)) {
            return res.status(400).json({ error: "Érvénytelen azonosító" });
        }
 
        const [sorok] = await pool.execute(
            `SELECT d.id, d.nev, d.email, d.aktiv, d.osztaly_id,
                    o.nev AS osztalyNev
             FROM diakok d
             INNER JOIN osztalyok o ON d.osztaly_id = o.id
             WHERE d.id = ?`,
            [Number(req.params.id)]
        );
 
        if (sorok.length === 0) {
            return res.status(404).json({ error: "Diák nem található" });
        }
 
        res.status(200).json(sorok[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Hiba az adatok olvasásakor", reszletek: error.message });
    }
});
 
app.use((req, res) => {
    res.status(404).json({ error: "Az útvonal nem található" });
});
 
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Szerverhiba" });
});
 
app.listen(PORT, () => {
    console.log(`Szerver fut a http://localhost:${PORT} címen`);
});