// Student Dashboard Functionality
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkAuth();
    if (!currentUser) return;
    
    if (currentUser.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('userName').textContent = currentUser.name;
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('foodSelectionDate').value = today;
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Load dashboard
    loadDashboard();
    loadProfile();
    loadFoodSelection();
    loadLeaves();
});

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
    });
    
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.remove('d-none');
        
        // Load section-specific data
        switch(sectionName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'profile':
                loadProfile();
                break;
            case 'food':
                loadFoodSelection();
                break;
            case 'leave':
                loadLeaves();
                break;
        }
    }
}

function loadDashboard() {
    const studentId = currentUser.studentId || currentUser.username;
    const leaves = getStudentLeaves();
    const myLeaves = leaves.filter(l => l.studentId === studentId);
    
    const pendingLeaves = myLeaves.filter(l => l.approvalStatus === 'Pending').length;
    const approvedLeaves = myLeaves.filter(l => l.approvalStatus === 'Approved').length;
    
    document.getElementById('pendingLeaves').textContent = pendingLeaves;
    document.getElementById('approvedLeaves').textContent = approvedLeaves;
    
    // Count food selections
    const today = new Date().toISOString().split('T')[0];
    const selections = getFoodSelections(today);
    const mySelection = selections[studentId];
    let selectionCount = 0;
    if (mySelection) {
        if (mySelection.morning) selectionCount++;
        if (mySelection.night) selectionCount++;
    }
    document.getElementById('foodSelections').textContent = selectionCount;
    
    // Load food menu
    const menu = getFoodMenu(today);
    
    let menuHtml = '<div class="row">';
    menuHtml += '<div class="col-md-6">';
    menuHtml += '<div class="food-menu-card morning">';
    menuHtml += '<h6><i class="bi bi-sunrise"></i> Morning Menu (Tiffin)</h6>';
    menuHtml += '<div class="food-items">';
    if (menu.morning.items.length > 0) {
        menu.morning.items.forEach(item => {
            menuHtml += `<div class="food-item">${item}</div>`;
        });
    } else {
        menuHtml += '<p class="text-muted">No menu set for today</p>';
    }
    menuHtml += '</div></div></div>';
    
    menuHtml += '<div class="col-md-6">';
    menuHtml += '<div class="food-menu-card night">';
    menuHtml += '<h6><i class="bi bi-moon"></i> Night Menu (Dinner)</h6>';
    menuHtml += '<div class="food-items">';
    if (menu.night.items.length > 0) {
        menu.night.items.forEach(item => {
            menuHtml += `<div class="food-item">${item}</div>`;
        });
    } else {
        menuHtml += '<p class="text-muted">No menu set for today</p>';
    }
    menuHtml += '</div></div></div>';
    menuHtml += '</div>';
    
    document.getElementById('foodMenuDisplay').innerHTML = menuHtml;
}

function loadProfile() {
    const studentId = currentUser.studentId || currentUser.username;
    const student = getStudentById(studentId);
    
    if (!student) {
        document.getElementById('profileDisplay').innerHTML = '<p>Profile not found</p>';
        return;
    }
    
    let profileHtml = '<div class="row">';
    profileHtml += '<div class="col-md-6">';
    profileHtml += '<table class="table table-bordered">';
    profileHtml += `<tr><th>Student ID</th><td>${student.id}</td></tr>`;
    profileHtml += `<tr><th>Name</th><td>${student.name}</td></tr>`;
    profileHtml += `<tr><th>Mobile</th><td>${student.mobile}</td></tr>`;
    if (student.parentNumber) {
        profileHtml += `<tr><th>Parent Number</th><td>${student.parentNumber}</td></tr>`;
    }
    profileHtml += `<tr><th>Batch Number</th><td>${student.batchNumber}</td></tr>`;
    profileHtml += `<tr><th>Current Batch</th><td>${student.currentBatch}</td></tr>`;
    profileHtml += `<tr><th>Hostel Status</th><td>${student.hostelStatus}</td></tr>`;
    profileHtml += '</table>';
    profileHtml += '</div></div>';
    
    document.getElementById('profileDisplay').innerHTML = profileHtml;
}

function loadFoodSelection() {
    const date = document.getElementById('foodSelectionDate').value || new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(date);
    const selections = getFoodSelections(date);
    const studentId = currentUser.studentId || currentUser.username;
    const mySelection = selections[studentId] || { morning: '', night: '' };
    
    // Display menu items
    let morningHtml = '';
    if (menu.morning.items.length > 0) {
        menu.morning.items.forEach(item => {
            morningHtml += `<div class="food-item">${item}</div>`;
        });
    } else {
        morningHtml = '<p class="text-muted">No menu set</p>';
    }
    document.getElementById('morningMenuItems').innerHTML = morningHtml;
    
    let nightHtml = '';
    if (menu.night.items.length > 0) {
        menu.night.items.forEach(item => {
            nightHtml += `<div class="food-item">${item}</div>`;
        });
    } else {
        nightHtml = '<p class="text-muted">No menu set</p>';
    }
    document.getElementById('nightMenuItems').innerHTML = nightHtml;
    
    // Set current selection
    document.getElementById('studentMorningSelection').value = mySelection.morning;
    document.getElementById('studentNightSelection').value = mySelection.night;
}

function saveStudentFoodSelection() {
    const date = document.getElementById('foodSelectionDate').value || new Date().toISOString().split('T')[0];
    const morning = document.getElementById('studentMorningSelection').value;
    const night = document.getElementById('studentNightSelection').value;
    const studentId = currentUser.studentId || currentUser.username;
    
    if (!morning || !night) {
        return; // Don't save if not both selected
    }
    
    saveFoodSelection(studentId, date, morning, night);
    loadFoodSelection();
    loadDashboard();
}

function loadLeaves() {
    const studentId = currentUser.studentId || currentUser.username;
    const leaves = getStudentLeaves();
    const myLeaves = leaves.filter(l => l.studentId === studentId);
    const tbody = document.getElementById('leavesTableBody');
    
    if (myLeaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No leave applications</td></tr>';
        return;
    }
    
    tbody.innerHTML = myLeaves.map(leave => {
        let statusBadge = '';
        let statusText = '';
        if (leave.approvalLevel === 0) {
            statusBadge = 'bg-warning';
            statusText = 'Pending - Awaiting Trainer Approval';
        } else if (leave.approvalLevel === 1) {
            statusBadge = 'bg-info';
            statusText = 'Level 1: Trainer Approved - Awaiting MIS';
        } else if (leave.approvalLevel === 2) {
            statusBadge = 'bg-primary';
            statusText = 'Level 2: MIS Approved - Awaiting Admin';
        } else if (leave.approvalLevel === 3) {
            statusBadge = 'bg-success';
            statusText = 'Approved - Final';
        } else if (leave.approvalStatus === 'Rejected') {
            statusBadge = 'bg-danger';
            statusText = 'Rejected';
        }
        
        return `
            <tr>
                <td>${leave.fromDate}</td>
                <td>${leave.toDate}</td>
                <td>${leave.reason}</td>
                <td><span class="badge ${statusBadge}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewLeave('${leave.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function showApplyLeaveModal() {
    document.getElementById('applyLeaveForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('applyLeaveModal'));
    modal.show();
}

function submitLeave() {
    const fromDate = document.getElementById('leaveFromDate').value;
    const toDate = document.getElementById('leaveToDate').value;
    const reason = document.getElementById('leaveReason').value;
    const studentId = currentUser.studentId || currentUser.username;
    const student = getStudentById(studentId);
    
    if (!fromDate || !toDate || !reason) {
        alert('Please fill all fields');
        return;
    }
    
    const leave = {
        id: 'LEAVE' + Date.now(),
        studentId: studentId,
        studentName: student ? student.name : currentUser.name,
        fromDate: fromDate,
        toDate: toDate,
        reason: reason,
        approvalStatus: 'Pending',
        approvalLevel: 0, // 0 = Pending, 1 = Trainer Approved, 2 = MIS Approved, 3 = Final Approved
        trainerApproved: false,
        trainerApprovedBy: '',
        trainerApprovedDate: '',
        misApproved: false,
        misApprovedBy: '',
        misApprovedDate: '',
        parentContacted: false,
        parentContactDate: '',
        adminApproved: false,
        adminApprovedBy: '',
        adminApprovedDate: '',
        leaveLetterReceived: false,
        appliedDate: new Date().toISOString().split('T')[0]
    };
    
    saveStudentLeave(leave);
    const modal = bootstrap.Modal.getInstance(document.getElementById('applyLeaveModal'));
    modal.hide();
    loadLeaves();
    loadDashboard();
    alert('Leave application submitted successfully. It will be reviewed by MIS.');
}

function viewLeave(id) {
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === id);
    if (!leave) return;
    
    let details = `Leave Details:\n\nFrom: ${leave.fromDate}\nTo: ${leave.toDate}\nReason: ${leave.reason}\nApplied: ${leave.appliedDate}\n\n`;
    details += `Approval Status:\n`;
    if (leave.approvalLevel === 0) {
        details += `- Pending Trainer Approval\n`;
    } else if (leave.approvalLevel === 1) {
        details += `- Level 1: Trainer Approved\n`;
        if (leave.trainerApprovedBy) details += `  Approved by: ${leave.trainerApprovedBy}\n`;
        if (leave.trainerApprovedDate) details += `  Date: ${leave.trainerApprovedDate}\n`;
        details += `- Awaiting MIS Approval\n`;
    } else if (leave.approvalLevel === 2) {
        details += `- Level 1: Trainer Approved\n`;
        if (leave.trainerApprovedBy) details += `  Approved by: ${leave.trainerApprovedBy}\n`;
        details += `- Level 2: MIS Approved\n`;
        if (leave.misApprovedBy) details += `  Approved by: ${leave.misApprovedBy}\n`;
        if (leave.parentContacted) details += `  Parent Contacted: Yes\n`;
        if (leave.misApprovedDate) details += `  Date: ${leave.misApprovedDate}\n`;
        details += `- Awaiting Admin Approval\n`;
    } else if (leave.approvalLevel === 3) {
        details += `- Level 1: Trainer Approved\n`;
        if (leave.trainerApprovedBy) details += `  Approved by: ${leave.trainerApprovedBy}\n`;
        details += `- Level 2: MIS Approved\n`;
        if (leave.misApprovedBy) details += `  Approved by: ${leave.misApprovedBy}\n`;
        details += `- Level 3: Admin Approved (Final)\n`;
        if (leave.adminApprovedBy) details += `  Approved by: ${leave.adminApprovedBy}\n`;
        if (leave.adminApprovedDate) details += `  Date: ${leave.adminApprovedDate}\n`;
    }
    
    alert(details);
}

