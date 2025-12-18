const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    // Geotagging data
    location: {
        lat: Number,
        lng: Number
    },
    // Image stored as a Base64 string for easy hackathon demo
    image: { type: String }, 
    // Status tracking: Pending -> In Progress -> Resolved
    status: { 
        type: String, 
        default: 'Pending',
        enum: ['Pending', 'In Progress', 'Resolved'] 
    },
    reportedBy: { type: String, required: true }, // User's Google Email
    adminComments: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Issue', IssueSchema);