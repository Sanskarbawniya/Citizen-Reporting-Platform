let userEmail = null;
let userCoords = null;

// Google Login Initialization
window.onload = function () {
    google.accounts.id.initialize({
        client_id: "763920868817-05elg4rfvt9hq7ig88ocj7vaf7o12ccr.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large" }
    );
};




















async function handleCredentialResponse(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));

    // 1. Send User Data to MongoDB
    const userData = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture
    };

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (res.ok) {
            userEmail = payload.email;
            // Update UI with user info
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            console.log("User saved to DB and logged in.");
            loadIssues();
        }
    } catch (err) {
        alert("Login failed to sync with database.");
    }
}

async function submitIssue() {
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('desc').value;
    const imageFile = document.getElementById('imageInput').files[0];

    // Basic Validation
    if (!title || !description) {
        alert("Please fill in the title and description.");
        return;
    }

    // Prepare data object
    const issueData = {
        title,
        category,
        description,
        location: userCoords || { lat: 0, lng: 0 }, // Default if not tagged
        reportedBy: userEmail,
        image: ""
    };

    // Handle Image if exists
    if (imageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onloadend = async () => {
            issueData.image = reader.result;
            sendToDatabase(issueData);
        };
    } else {
        sendToDatabase(issueData);
    }
}

async function sendToDatabase(data) {
    try {
        const response = await fetch('/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert("Issue reported successfully!");
            // Clear form
            document.getElementById('title').value = "";
            document.getElementById('desc').value = "";
            loadIssues();
        } else {
            const err = await response.json();
            alert("Error: " + err.error);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Could not connect to server.");
    }
}







// Login as admin and citizen tabs logic 

// Tab Switching Logic
function switchTab(role) {
    const citizenSection = document.getElementById('citizen-section');
    const adminSection = document.getElementById('admin-section');
    const tabs = document.querySelectorAll('.tab-btn');

    if (role === 'citizen') {
        citizenSection.classList.remove('hidden');
        adminSection.classList.add('hidden');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        citizenSection.classList.add('hidden');
        adminSection.classList.remove('hidden');
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
    }
}

// Admin Login Function
async function adminLogin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass })
    });

    if (res.ok) {
        // Redirect to the Admin Dashboard page
        window.location.href = 'admin.html';
    } else {
        alert("Invalid Authority Credentials");
    }
}




































// Add a simple Logout function to switch back
function logout() {
    location.reload(); // Simplest way to reset state for a hackathon
}
















// Geotagging
function getLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
        userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        document.getElementById('loc-status').innerText = "Location Tagged ✅";
    });
}

// Submit Issue
async function submitIssue() {
    const file = document.getElementById('imageInput').files[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
        const issueData = {
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            description: document.getElementById('desc').value,
            location: userCoords,
            image: reader.result,
            reportedBy: userEmail
        };

        await fetch('/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(issueData)
        });
        alert("Report Submitted!");
        loadIssues();
    };
    if (file) reader.readAsDataURL(file);
    else alert("Please attach a photo evidence.");
}

async function loadIssues() {
    const res = await fetch('/api/issues');
    const issues = await res.json();
    const list = document.getElementById('issues-list');

    list.innerHTML = issues.map(i => {
        // Color coding for tracking progress
        let statusColor = i.status === 'Resolved' ? '#166534' : (i.status === 'In Progress' ? '#9a3412' : '#991b1b');
        let statusBg = i.status === 'Resolved' ? '#dcfce7' : (i.status === 'In Progress' ? '#ffedd5' : '#fee2e2');

        return `
            <div class="issue-card">
                <span class="status-tag" style="background: ${statusBg}; color: ${statusColor};">
                    ${i.status}
                </span>
                <h4>${i.title}</h4>
                <p>${i.description}</p>
                <div class="meta">
                    <small>📍 Location: ${i.location ? 'Tagged' : 'Not provided'}</small><br>
                    <small>📅 Reported: ${new Date(i.createdAt).toLocaleDateString()}</small>
                </div>
                ${i.adminComments ? `<div class="admin-note"><strong>Admin Note:</strong> ${i.adminComments}</div>` : ''}
            </div>
        `;
    }).join('');
}