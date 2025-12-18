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
















// Handle Google Sign-in Response

function handleCredentialResponse(response) {
    try {
        // 1. Decode the JWT token from Google
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const user = JSON.parse(jsonPayload);
        userEmail = user.email;

        console.log("Login Success for:", userEmail);

        // 2. Hide Login Screen and Show Main App
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('app');

        if (loginScreen && mainApp) {
            loginScreen.classList.add('hidden'); // This hides the blue screen
            mainApp.classList.remove('hidden');  // This shows the dashboard
            console.log("Transitioning to main app...");
            
            // 3. Load the data now that we are "logged in"
            loadIssues();
        } else {
            console.error("Could not find login-screen or app IDs in HTML");
        }

    } catch (error) {
        console.error("Error handling Google Sign-in:", error);
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