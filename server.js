const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rasmlarni saqlash
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

let users = []; 
const MY_CARD = "9860350145660840"; 

// 1. REGISTRATSIYA (Rasm bilan)
app.post('/api/register', upload.single('logo'), (req, res) => {
    const { email, password, name, job, company, address, phone, web, last4 } = req.body;
    if (users.find(u => u.last4 === last4)) return res.status(400).json({ error: "Karta band!" });

    const userId = Date.now().toString();
    users.push({
        id: userId, email, password, name, job, company, address, phone, web, last4,
        logo: req.file ? `/uploads/${req.file.filename}` : null,
        balance: 0, isActive: false, isPaid: false,
        trialEndsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    });
    res.json({ success: true, userId });
});

// 2. LOGIN
app.post('/api/login', upload.none(), (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: "Xato!" });
    res.json({ success: true, userId: user.id });
});

// 3. VIZITKA MA'LUMOTI
app.get('/api/user/:id', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "Topilmadi" });
    const isExpired = new Date() > new Date(user.trialEndsAt);
    res.json({ data: user, isBlocked: !user.isActive || (isExpired && !user.isPaid) });
});

app.post('/api/get-pay-links', (req, res) => {
    const { amount } = req.body;
    res.json({ links: {
        click: `https://my.click.uz/services/p2p?card_number=${MY_CARD}&amount=${amount}`,
        payme: `https://checkout.paycom.uz/direct/${MY_CARD}/${amount * 100}`
    }});
});

app.listen(5000, () => console.log("🚀 Server yoniq!"));
