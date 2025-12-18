require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Issue = require('./models/issue.js'); // Import the model here

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ Connection Error:", err));

// 1. Create a Report
app.post('/api/issues', async (req, res) => {
    try {
        const newIssue = new Issue(req.body);
        await newIssue.save();
        res.status(201).json(newIssue);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 2. Get All Reports (For the Feed)
app.get('/api/issues', async (req, res) => {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
});

// 3. Update Issue Status (The Tracking Logic)
app.patch('/api/issues/:id', async (req, res) => {
    const { status, adminComments } = req.body;
    const updatedIssue = await Issue.findByIdAndUpdate(
        req.params.id, 
        { status, adminComments }, 
        { new: true }
    );
    res.json(updatedIssue);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));