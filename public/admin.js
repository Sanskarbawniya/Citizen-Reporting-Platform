// Admin Page JS - public/admin.js (prevents citizen from accessing admin page)
window.onload = async function () {
    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();

        if (!data.loggedIn || data.role !== 'admin') {
            window.location.href = 'index.html';
        } else {
            console.log("Admin verified:", data.userEmail);
            loadAdminIssues();
        }
    } catch (err) {
        console.error("Session check failed");
        window.location.href = 'index.html';
    }
};






// Gives admin the ability to change status and add comments to issues


window.onload = loadAdminIssues;

async function loadAdminIssues() {
    const res = await fetch('/api/issues');
    const issues = await res.json();
    const list = document.getElementById('admin-issues-list');

    list.innerHTML = issues.map(i => {
        // Create the Google Maps Link if coordinates exist
        const mapLink = (i.location && i.location.lat && i.location.lng) 
            ? `<a href="https://www.google.com/maps?q=${i.location.lat},${i.location.lng}" 
                  target="_blank" class="map-btn">📍 View Exact Location</a>`
            : `<span style="color: gray;">📍 No location tagged</span>`;

        return `
        <div class="admin-card">
            <div class="admin-info">
                <h3>${i.title}</h3>
                <p>${i.description}</p>
                <small><strong>Reported by:</strong> ${i.reportedBy}</small><br>
                
                <div style="margin: 10px 0;">
                    ${mapLink}
                </div>

                <img src="${i.image}" style="width:150px; border-radius: 8px; display:block; margin: 10px 0; border: 1px solid #ddd;">
            </div>
            
            <div class="admin-actions">
                <label style="font-family: sans-serif; font-weight: bold;">Update Status:</label>
                <select onchange="updateStatus('${i._id}', this.value)">
                    <option value="Pending" ${i.status === 'Pending' ? 'selected' : ''}>Pending ❌</option>
                    <option value="In Progress" ${i.status === 'In Progress' ? 'selected' : ''}>In Progress ⌛</option>
                    <option value="Resolved" ${i.status === 'Resolved' ? 'selected' : ''}>Resolved ✅</option>
                </select>
                <br><br>
                <textarea placeholder="Add official comment..." id="comment-${i._id}">${i.adminComments || ''}</textarea>
                <button onclick="saveComment('${i._id}')">Save Comment</button>
            </div>
        </div>
    `;}).join('');
}

async function updateStatus(id, newStatus) {
    await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    alert("Status Updated!");
}

async function saveComment(id) {
    const comment = document.getElementById(`comment-${id}`).value;
    await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminComments: comment })
    });
    alert("Comment Saved!");
}   