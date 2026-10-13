const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());

const db = mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'rock_zenekarok_70s'
});

db.connect((err) => {
    if (err) {
        console.log('Adatbázis kapcsolódási hiba:', err);
    } else {
        console.log('Sikeres adatbázis kapcsolat!');
    }
});


app.get('/api/zenekarok', (req, res) => {
    db.query('SELECT * FROM zenekarok', (err, result) => {
        if (err) {
            return res.status(500).json({ hiba: err.message });
        }

        res.status(200).json(result);
    });
});


app.get('/api/stilusok', (req, res) => {
    db.query('SELECT * FROM stilusok', (err, result) => {
        if (err) {
            return res.status(500).json({ hiba: err.message });
        }

        res.status(200).json(result);
    });
});

app.listen(3000, () => {
    console.log('Szerver fut: http://localhost:3000');
});