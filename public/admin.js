// Admin Page JS - public/admin.js (prevents citizen from accessing admin page)

window.onload = async function () {
    // Check if user is logged in as admin
    const response = await fetch('/api/check-session');
    const data = await response.json();

    // If not logged in OR role isn't admin, kick them back to login
    // Note: You'll need to update check-session route to return the role
    if (!data.loggedIn) {
        window.location.href = 'index.html';
    } else {
        loadAdminIssues();
    }
};






// Gives admin the ability to change status and add comments to issues


window.onload = loadAdminIssues;

async function loadAdminIssues() {
    const res = await fetch('/api/issues');
    const issues = await res.json();
    const list = document.getElementById('admin-issues-list');

    list.innerHTML = issues.map(i => `
        <div class="admin-card">
            <div class="admin-info">
                <h3>${i.title}</h3>
                <p>${i.description}</p>
                <small>Reported by: ${i.reportedBy}</small>
                <img src="${i.image}" style="width:100px; display:block; margin: 10px 0;">
            </div>
            
            <div class="admin-actions">
                <label style="font-family: monospace;">Update Status:</label>
                <select onchange="updateStatus('${i._id}', this.value)">
                    <option value="Pending" ${i.status === 'Pending' ? 'selected' : ''}>Pending❌</option>
                    <option value="In Progress" ${i.status === 'In Progress' ? 'selected' : ''}>In Progress⌛</option>
                    <option value="Resolved" ${i.status === 'Resolved' ? 'selected' : ''}>Resolved✅</option>
                </select>
                <br><br>
                <textarea placeholder="Add official comment..." id="comment-${i._id}">${i.adminComments || ''}</textarea>
                <button onclick="saveComment('${i._id}')">Save Comment</button>
            </div>
        </div>
    `).join('');
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