require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const cookieParser = require('cookie-parser');

// Import Models
const Issue = require('./models/Issue');
const User = require('./models/User');

const app = express();
app.set('trust proxy', 1);

// --- 1. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- 2. Cookies parser ---
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// --- 3. SESSION SETUP FOR ADMIN ---
app.use(session({
    secret: 'civic-connect-2025-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        client: mongoose.connection.getClient()
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: false 
    }
}));

app.use(express.static('public'));

// --- 4. AUTHENTICATION ROUTES ---

// Check if user is logged in (Runs on page refresh)
app.get('/api/check-session', (req, res) => {
    if (req.session && req.session.userEmail) {
        res.json({
            loggedIn: true,
            userEmail: req.session.userEmail,
            role: req.session.role || 'citizen'
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// Admin Login
app.post('/api/admin-login', (req, res) => {
    const { user, pass } = req.body;
    console.log(`Admin Login attempt: ${user}`);

    if (user === process.env.ADMIN_EMAIL && pass === process.env.ADMIN_PASSWORD) {
        req.session.role = 'admin';
        req.session.userEmail = user;
        req.session.save((err) => { 
            if (err) return res.status(500).json({ error: "Session save failed" });
            res.status(200).json({ message: "Success" });
        });
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

// Citizen (Google) Login Sync
app.post('/api/users', async (req, res) => {
    try {
        const { email, name, picture } = req.body;
        const user = await User.findOneAndUpdate(
            { email },
            { name, picture, lastLogin: Date.now() },
            { upsert: true, new: true }
        );
        req.session.userEmail = user.email;
        req.session.role = 'citizen';
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ error: "Session sync failed" });
            }
            res.status(200).json(user);
        });
    } catch (err) {
        res.status(500).json({ error: "Sync failed" });
    }
});

// --- 5. ISSUE ROUTES ---

app.post('/api/issues', async (req, res) => {
    try {
        const newIssue = new Issue(req.body);
        await newIssue.save();
        res.status(201).json(newIssue);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all issues
app.get('/api/issues', async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ error: "Fetch failed" });
    }
});

// Update issue by ID
app.patch('/api/issues/:id', async (req, res) => {
    try {
        const updated = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out" });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));