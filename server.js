const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Multer'ı bellek içinde saklayacak şekilde yapılandır
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🛠️ Statik dosyaları sun (index.html gösterilecek)
app.use(express.static(path.join(__dirname, '../backend')));  // Doğru dizini ayarla

// PostgreSQL bağlantısı
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
});

// Kayıt olma işlemi
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, hashedPassword]);
        res.status(201).json({ message: 'Kayıt başarılı!' });
    } catch (error) {
        res.status(500).json({ error: 'Kullanıcı kaydedilirken hata oluştu.' });
    }
});

// Giriş işlemi
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'Kullanıcı bulunamadı!' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Hatalı şifre!' });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Giriş yapılırken hata oluştu.' });
    }
});

app.get('/profile', async (req, res) => {
    const token = req.headers.authorization;  
    if (!token) return res.status(401).json({ error: 'Yetkisiz erişim!' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  
        const result = await pool.query('SELECT username FROM users WHERE id = $1', [decoded.id]);  

        if (result.rows.length > 0) {
            res.json({ username: result.rows[0].username });  
        } else {
            res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Mesaj gönderme
app.post('/messages', upload.single('image'), async (req, res) => {
    const { username, message } = req.body;
    console.log("Gelen Veri:", req.body);  // Debugging için ekledik

    if (!username || !message) {
        return res.status(400).json({ error: 'Kullanıcı adı ve mesaj gereklidir!' });
    }

    const image = req.file ? req.file.buffer : null;

    try {
        await pool.query('INSERT INTO messages (username, message, image) VALUES ($1, $2, $3)', [username, message, image]);
        res.status(201).json({ message: 'Mesaj başarıyla gönderildi!' });
    } catch (error) {
        console.error('Mesaj kaydedilirken hata oluştu:', error);
        res.status(500).json({ error: 'Mesaj gönderilirken hata oluştu.' });
    }
});

// Tüm mesajları getir (herkes görebilir)
app.get('/messages', async (req, res) => {
    try {
        const result = await pool.query('SELECT username, message, image, created_at FROM messages ORDER BY created_at DESC');

        // Resim verisini Base64 formatına çevir
        const messages = result.rows.map(msg => ({
            ...msg,
            image: msg.image ? `data:image/png;base64,${msg.image.toString('base64')}` : null
        }));

        res.json(messages);
    } catch (error) {
        console.error('Mesajlar getirilirken hata oluştu:', error);
        res.status(500).json({ error: 'Mesajlar getirilirken hata oluştu.' });
    }
});


// 🛠️ Eğer route bulunamazsa, index.html göster (SPA için)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Sunucuyu başlat
app.listen(5000, () => {
    console.log('Server 5000 portunda çalışıyor...');
});

