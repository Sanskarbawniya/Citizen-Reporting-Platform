let userEmail = null;
let userCoords = null;

// 1. INITIALIZATION & SESSION CHECK
window.onload = function () {
    checkSession(); 

    google.accounts.id.initialize({
        client_id: "763920868817-05elg4rfvt9hq7ig88ocj7vaf7o12ccr.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large" }
    );
};

async function checkSession() {
    try {
        const res = await fetch('/api/check-session', { credentials: 'include' });
        const data = await res.json();

        if (data.loggedIn) {
            userEmail = data.userEmail;
            // Handle UI if on index.html
            const loginScreen = document.getElementById('login-screen');
            const appScreen = document.getElementById('app');
            
            if (loginScreen && appScreen) {
                loginScreen.classList.add('hidden');
                appScreen.classList.remove('hidden');
            }
            console.log("Session restored for:", userEmail);
            loadIssues();
        }
    } catch (err) {
        console.log("No active session found.");
    }
}

// 2. AUTHENTICATION (GOOGLE & ADMIN)
async function handleCredentialResponse(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const userData = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture
    };

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
            credentials: 'include'
        });

        if (res.ok) {
            userEmail = payload.email;
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            loadIssues();
        }
    } catch (err) {
        alert("Login failed to sync.");
    }
}

async function adminLogin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
        credentials: 'include'
    });

    if (res.ok) {
        window.location.href = 'admin.html';
    } else {
        alert("Invalid Authority Credentials");
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { 
            method: 'POST', 
            credentials: 'include' 
        });
        // This forces the browser to go back to the main login page
        window.location.replace('/'); 
    } catch (err) {
        window.location.replace('/');
    }
}

// 3. ISSUE HANDLING
async function submitIssue() {
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('desc').value;
    const file = document.getElementById('imageInput').files[0];

    if (!title || !description || !file) {
        alert("Please fill all fields and provide a photo.");
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
        const issueData = {
            title,
            category,
            description,
            location: userCoords || { lat: 0, lng: 0 },
            image: reader.result,
            reportedBy: userEmail
        };

        const response = await fetch('/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(issueData)
        });

        if (response.ok) {
            alert("Issue reported successfully!");
            document.getElementById('title').value = "";
            document.getElementById('desc').value = "";
            loadIssues();
        }
    };
}

// 4. UTILITIES
function getLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
        userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        document.getElementById('loc-status').innerText = "Location Tagged ✅";
    });
}

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

async function loadIssues() {
    const res = await fetch('/api/issues');
    const issues = await res.json();
    const list = document.getElementById('issues-list');
    if(!list) return; // Exit if not on the page with the list

    list.innerHTML = issues.map(i => {
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