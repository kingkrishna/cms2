// MIS Dashboard Functionality
let currentUser = null;
let currentLeaveType = 'student';

document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkAuth();
    if (!currentUser) return;
    
    if (currentUser.role !== 'mis') {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('userName').textContent = currentUser.name;
    
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
    loadStudents();
    loadAttendance();
    currentLeaveType = 'level1'; // Set default to Level 1 approved leaves
    loadLeaves();
    loadHostel();
    loadCanteen();
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
            case 'students':
                loadStudents();
                break;
            case 'attendance':
                loadAttendance();
                break;
            case 'leaves':
                loadLeaves();
                break;
            case 'hostel':
                loadHostel();
                break;
            case 'canteen':
                loadCanteen();
                break;
        }
    }
}

function loadDashboard() {
    const students = getStudents();
    document.getElementById('totalStudents').textContent = students.length;
    
    const pendingAttendance = students.filter(s => 
        !s.attendance || !s.attendance.onlineClassCompleted || !s.attendance.offlineRecordsReceived
    ).length;
    document.getElementById('pendingAttendance').textContent = pendingAttendance;
    
    const studentLeaves = getStudentLeaves();
    const level1ApprovedLeaves = studentLeaves.filter(l => l.approvalLevel === 1).length;
    
    const trainerLeaves = getTrainerLeaves();
    const pendingTrainerLeaves = trainerLeaves.filter(l => l.status === 'Pending').length;
    
    document.getElementById('pendingLeaves').textContent = level1ApprovedLeaves;
    document.getElementById('trainerLeaves').textContent = pendingTrainerLeaves;
    
    // Load food menu
    const today = new Date().toISOString().split('T')[0];
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
    menuHtml += '<div class="mt-2"><strong>Tiffin Selection Count: ' + menu.morning.selectedCount + '</strong></div>';
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
    menuHtml += '<div class="mt-2"><strong>Dinner Selection Count: ' + menu.night.selectedCount + '</strong></div>';
    menuHtml += '</div></div></div>';
    menuHtml += '</div>';
    
    document.getElementById('foodMenuDisplay').innerHTML = menuHtml;
}

function loadStudents() {
    const students = getStudents();
    const tbody = document.getElementById('studentsTableBody');
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.mobile}</td>
            <td>
                ${student.parentNumber ? `<a href="tel:${student.parentNumber}" class="btn btn-sm btn-success"><i class="bi bi-telephone"></i> ${student.parentNumber}</a>` : 'N/A'}
            </td>
            <td>${student.currentBatch}</td>
            <td><span class="badge ${student.hostelStatus === 'Yes' ? 'bg-success' : 'bg-secondary'}">${student.hostelStatus}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewStudent('${student.id}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="editStudent('${student.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function loadAttendance() {
    const students = getStudents();
    const tbody = document.getElementById('attendanceTableBody');
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.currentBatch}</td>
            <td>
                <span class="badge ${student.attendance && student.attendance.onlineClassCompleted ? 'bg-success' : 'bg-danger'}">
                    ${student.attendance && student.attendance.onlineClassCompleted ? 'Completed' : 'Pending'}
                </span>
            </td>
            <td>
                <span class="badge ${student.attendance && student.attendance.offlineRecordsReceived ? 'bg-success' : 'bg-danger'}">
                    ${student.attendance && student.attendance.offlineRecordsReceived ? 'Received' : 'Pending'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showUpdateAttendance('${student.id}')">
                    <i class="bi bi-pencil"></i> Update
                </button>
            </td>
        </tr>
    `).join('');
}

function loadLeaves() {
    // Default to showing Level 1 approved leaves
    if (!currentLeaveType || currentLeaveType === 'level1') {
        showLevel1ApprovedLeaves();
    } else if (currentLeaveType === 'allstudent') {
        showAllStudentLeaves();
    } else if (currentLeaveType === 'trainer') {
        showTrainerLeaves();
    } else {
        showLevel1ApprovedLeaves();
    }
}

function showLevel1ApprovedLeaves() {
    currentLeaveType = 'level1';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.textContent.includes('Level 1')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    const leaves = getStudentLeaves();
    // Show only Level 1 approved leaves (awaiting Level 2 - MIS approval)
    const level1Leaves = leaves.filter(l => l.approvalLevel === 1 && l.approvalStatus !== 'Rejected');
    const tbody = document.getElementById('leavesTableBody');
    
    if (level1Leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No Level 1 approved leaves awaiting MIS approval</td></tr>';
        return;
    }
    
    tbody.innerHTML = level1Leaves.map(leave => `
        <tr>
            <td>${leave.studentId || leave.studentName}</td>
            <td>${leave.fromDate}</td>
            <td>${leave.toDate}</td>
            <td>${leave.reason}</td>
            <td><span class="badge ${leave.parentContacted ? 'bg-success' : 'bg-warning'}">${leave.parentContacted ? 'Contacted' : 'Not Contacted'}</span></td>
            <td><span class="badge ${leave.leaveLetterReceived ? 'bg-success' : 'bg-danger'}">${leave.leaveLetterReceived ? 'Yes' : 'No'}</span></td>
            <td><span class="badge bg-info">Level 1 Approved</span></td>
            <td>
                <button class="btn btn-sm btn-success" onclick="callParent('${leave.studentId || leave.studentName}')">
                    <i class="bi bi-telephone"></i> Call Parent
                </button>
                <button class="btn btn-sm btn-primary" onclick="approveLeaveLevel2('${leave.id}')">
                    <i class="bi bi-check-circle"></i> Approve Level 2
                </button>
                <button class="btn btn-sm btn-danger" onclick="rejectLeave('${leave.id}')">
                    <i class="bi bi-x-circle"></i> Reject
                </button>
            </td>
        </tr>
    `).join('');
}

function callParent(studentId) {
    const student = getStudentById(studentId);
    if (student && student.parentNumber) {
        const confirmed = confirm(`Call parent of ${student.name}?\nParent Number: ${student.parentNumber}\n\nClick OK to mark as contacted.`);
        if (confirmed) {
            // Mark parent as contacted for all pending leaves of this student
            const leaves = getStudentLeaves();
            const studentLeaves = leaves.filter(l => l.studentId === studentId && l.approvalLevel === 1);
            studentLeaves.forEach(leave => {
                leave.parentContacted = true;
                leave.parentContactDate = new Date().toISOString().split('T')[0];
                const index = leaves.findIndex(l => l.id === leave.id);
                if (index >= 0) {
                    leaves[index] = leave;
                }
            });
            localStorage.setItem('studentLeaves', JSON.stringify(leaves));
            showLevel1ApprovedLeaves();
            alert(`Parent contacted. You can now approve at Level 2.`);
        }
    } else {
        alert(`Parent number not found for student ${studentId}`);
    }
}

function approveLeaveLevel2(leaveId) {
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return;
    
    if (!leave.parentContacted) {
        alert('Please contact parent first before approving at Level 2.');
        return;
    }
    
    if (!confirm('Approve this leave at Level 2 (MIS Approval)? This will forward it to Admin for final approval.')) {
        return;
    }
    
    leave.approvalLevel = 2;
    leave.misApproved = true;
    leave.misApprovedBy = currentUser.name;
    leave.misApprovedDate = new Date().toISOString().split('T')[0];
    leave.approvalStatus = 'MIS Approved';
    
    const index = leaves.findIndex(l => l.id === leaveId);
    if (index >= 0) {
        leaves[index] = leave;
    }
    localStorage.setItem('studentLeaves', JSON.stringify(leaves));
    
    loadLeaves();
    loadDashboard();
    alert('Leave approved at Level 2. It will now be forwarded to Admin for final approval.');
}

function rejectLeave(leaveId) {
    if (!confirm('Reject this leave application?')) {
        return;
    }
    
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return;
    
    leave.approvalStatus = 'Rejected';
    leave.approvalLevel = -1;
    
    const index = leaves.findIndex(l => l.id === leaveId);
    if (index >= 0) {
        leaves[index] = leave;
    }
    localStorage.setItem('studentLeaves', JSON.stringify(leaves));
    
    loadLeaves();
    loadDashboard();
    alert('Leave application rejected.');
}

function showAllStudentLeaves() {
    currentLeaveType = 'allstudent';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.textContent.includes('All Student')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    const leaves = getStudentLeaves();
    const tbody = document.getElementById('leavesTableBody');
    
    if (leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No student leave applications</td></tr>';
        return;
    }
    
    tbody.innerHTML = leaves.map(leave => {
        let statusBadge = '';
        let statusText = '';
        if (leave.approvalLevel === 0) {
            statusBadge = 'bg-warning';
            statusText = 'Pending Level 1';
        } else if (leave.approvalLevel === 1) {
            statusBadge = 'bg-info';
            statusText = 'Level 1 Approved';
        } else if (leave.approvalLevel === 2) {
            statusBadge = 'bg-primary';
            statusText = 'Level 2 Approved';
        } else if (leave.approvalLevel === 3) {
            statusBadge = 'bg-success';
            statusText = 'Final Approved';
        } else if (leave.approvalStatus === 'Rejected') {
            statusBadge = 'bg-danger';
            statusText = 'Rejected';
        }
        
        return `
            <tr>
                <td>${leave.studentId || leave.studentName}</td>
                <td>${leave.fromDate}</td>
                <td>${leave.toDate}</td>
                <td>${leave.reason}</td>
                <td><span class="badge ${leave.parentContacted ? 'bg-success' : 'bg-warning'}">${leave.parentContacted ? 'Yes' : 'No'}</span></td>
                <td><span class="badge ${leave.leaveLetterReceived ? 'bg-success' : 'bg-danger'}">${leave.leaveLetterReceived ? 'Yes' : 'No'}</span></td>
                <td><span class="badge ${statusBadge}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showUpdateLeave('${leave.id}', 'student')">
                        <i class="bi bi-pencil"></i> Update
                    </button>
                    <button class="btn btn-sm btn-success" onclick="callParent('${leave.studentId || leave.studentName}')">
                        <i class="bi bi-telephone"></i> Call Parent
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function showStudentLeaves() {
    currentLeaveType = 'student';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.textContent.includes('Student')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    const leaves = getStudentLeaves();
    // Show only approved student leaves in MIS
    const approvedLeaves = leaves.filter(l => l.approvalStatus === 'Approved');
    const tbody = document.getElementById('leavesTableBody');
    
    if (approvedLeaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No approved student leave applications</td></tr>';
        return;
    }
    
    tbody.innerHTML = approvedLeaves.map(leave => `
        <tr>
            <td>${leave.studentId || leave.studentName}</td>
            <td>${leave.fromDate}</td>
            <td>${leave.toDate}</td>
            <td>${leave.reason}</td>
            <td><span class="badge ${leave.leaveLetterReceived ? 'bg-success' : 'bg-danger'}">${leave.leaveLetterReceived ? 'Yes' : 'No'}</span></td>
            <td><span class="badge bg-success">${leave.approvalStatus}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showUpdateLeave('${leave.id}', 'student')">
                    <i class="bi bi-pencil"></i> Update
                </button>
                <button class="btn btn-sm btn-success" onclick="callParent('${leave.studentId || leave.studentName}')">
                    <i class="bi bi-telephone"></i> Call Parent
                </button>
            </td>
        </tr>
    `).join('');
}

function showTrainerLeaves() {
    currentLeaveType = 'trainer';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.textContent.includes('Trainer')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    const leaves = getTrainerLeaves();
    const tbody = document.getElementById('leavesTableBody');
    
    if (leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No trainer leave applications</td></tr>';
        return;
    }
    
    tbody.innerHTML = leaves.map(leave => `
        <tr>
            <td>${leave.trainerName}</td>
            <td>${leave.fromDate}</td>
            <td>${leave.toDate}</td>
            <td>${leave.reason}</td>
            <td><span class="badge ${leave.document ? 'bg-success' : 'bg-danger'}">${leave.document ? 'Yes' : 'No'}</span></td>
            <td><span class="badge ${leave.status === 'Approved' ? 'bg-success' : leave.status === 'Rejected' ? 'bg-danger' : 'bg-warning'}">${leave.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showUpdateLeave('${leave.id}', 'trainer')">
                    <i class="bi bi-pencil"></i> Update
                </button>
            </td>
        </tr>
    `).join('');
}

function loadHostel() {
    const students = getStudents();
    const hostelStudents = students.filter(s => s.hostelStatus === 'Yes');
    const tbody = document.getElementById('hostelTableBody');
    
    if (hostelStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hostel students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = hostelStudents.map(student => `
        <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.hostel && student.hostel.inTime ? student.hostel.inTime : 'Not Set'}</td>
            <td>${student.hostel && student.hostel.outTime ? student.hostel.outTime : 'Not Set'}</td>
            <td><span class="badge ${student.leave && student.leave.leaveLetterReceived ? 'bg-success' : 'bg-danger'}">${student.leave && student.leave.leaveLetterReceived ? 'Yes' : 'No'}</span></td>
        </tr>
    `).join('');
}

function loadCanteen() {
    const stock = getCanteenStock();
    const stockHtml = stock.map(item => `
        <div class="mb-2">
            <strong>${item.item}:</strong> ${item.quantity} ${item.unit}
        </div>
    `).join('');
    document.getElementById('stockDisplay').innerHTML = stockHtml || '<p class="text-muted">No stock data</p>';
    
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    const selectionHtml = `
        <div class="mb-2">
            <strong>Tiffin (Morning):</strong> ${menu.morning.selectedCount} selections
        </div>
        <div class="mb-2">
            <strong>Dinner (Night):</strong> ${menu.night.selectedCount} selections
        </div>
    `;
    document.getElementById('foodSelectionDisplay').innerHTML = selectionHtml;
}

function showAddStudentModal() {
    document.getElementById('addStudentForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
    modal.show();
}

function saveStudent() {
    const student = {
        id: document.getElementById('studentId').value,
        name: document.getElementById('studentName').value,
        mobile: document.getElementById('studentMobile').value,
        parentNumber: document.getElementById('parentNumber').value,
        batchNumber: document.getElementById('batchNumber').value,
        currentBatch: document.getElementById('currentBatch').value,
        currentBatchId: document.getElementById('batchNumber').value,
        hostelStatus: document.getElementById('hostelStatus').value,
        location: document.getElementById('location').value || '',
        attendance: {
            onlineClassCompleted: false,
            offlineRecordsReceived: false
        },
        leave: {
            approvalStatus: 'Pending',
            leaveLetterReceived: false
        },
        hostel: {
            inTime: '',
            outTime: '',
            movementHistory: []
        },
        foodSelection: {}
    };
    
    saveStudentData(student);
    const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
    modal.hide();
    loadStudents();
    loadDashboard();
}

function saveStudentData(student) {
    const students = getStudents();
    const index = students.findIndex(s => s.id === student.id);
    if (index >= 0) {
        students[index] = { ...students[index], ...student };
    } else {
        students.push(student);
    }
    localStorage.setItem('students', JSON.stringify(students));
}

function viewStudent(id) {
    const student = getStudentById(id);
    if (!student) return;
    
    let details = `Student Details:\n\nID: ${student.id}\nName: ${student.name}\nMobile: ${student.mobile}\n`;
    if (student.parentNumber) {
        details += `Parent Number: ${student.parentNumber}\n`;
    }
    details += `Batch: ${student.currentBatch}\nHostel: ${student.hostelStatus}`;
    alert(details);
}

function editStudent(id) {
    const student = getStudentById(id);
    if (!student) return;
    
    document.getElementById('studentId').value = student.id;
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentMobile').value = student.mobile;
    document.getElementById('parentNumber').value = student.parentNumber || '';
    document.getElementById('batchNumber').value = student.batchNumber;
    document.getElementById('currentBatch').value = student.currentBatch;
    document.getElementById('hostelStatus').value = student.hostelStatus;
    document.getElementById('location').value = student.location || '';
    
    const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
    modal.show();
}

function showUpdateAttendance(studentId) {
    const student = getStudentById(studentId);
    if (!student) return;
    
    document.getElementById('attendanceStudentId').value = studentId;
    document.getElementById('onlineClassCompleted').checked = student.attendance && student.attendance.onlineClassCompleted;
    document.getElementById('offlineRecordsReceived').checked = student.attendance && student.attendance.offlineRecordsReceived;
    
    const modal = new bootstrap.Modal(document.getElementById('updateAttendanceModal'));
    modal.show();
}

function updateAttendance() {
    const studentId = document.getElementById('attendanceStudentId').value;
    const student = getStudentById(studentId);
    if (!student) return;
    
    student.attendance = {
        onlineClassCompleted: document.getElementById('onlineClassCompleted').checked,
        offlineRecordsReceived: document.getElementById('offlineRecordsReceived').checked
    };
    
    saveStudentData(student);
    const modal = bootstrap.Modal.getInstance(document.getElementById('updateAttendanceModal'));
    modal.hide();
    loadAttendance();
    loadDashboard();
}

function showUpdateLeave(leaveId, type) {
    document.getElementById('leaveId').value = leaveId;
    document.getElementById('leaveType').value = type;
    
    if (type === 'student') {
        const leaves = getStudentLeaves();
        const leave = leaves.find(l => l.id === leaveId);
        if (leave) {
            document.getElementById('leaveApprovalStatus').value = leave.approvalStatus || 'Pending';
            document.getElementById('leaveLetterReceived').checked = leave.leaveLetterReceived || false;
        }
    } else {
        const leaves = getTrainerLeaves();
        const leave = leaves.find(l => l.id === leaveId);
        if (leave) {
            document.getElementById('leaveApprovalStatus').value = leave.status || 'Pending';
            document.getElementById('leaveLetterReceived').checked = leave.document ? true : false;
        }
    }
    
    const modal = new bootstrap.Modal(document.getElementById('updateLeaveModal'));
    modal.show();
}

function updateLeaveApproval() {
    const leaveId = document.getElementById('leaveId').value;
    const type = document.getElementById('leaveType').value;
    const approvalStatus = document.getElementById('leaveApprovalStatus').value;
    const leaveLetterReceived = document.getElementById('leaveLetterReceived').checked;
    
    if (type === 'student') {
        const leaves = getStudentLeaves();
        const leave = leaves.find(l => l.id === leaveId);
        if (leave) {
            leave.approvalStatus = approvalStatus;
            leave.leaveLetterReceived = leaveLetterReceived;
            
            const index = leaves.findIndex(l => l.id === leaveId);
            if (index >= 0) {
                leaves[index] = leave;
            }
            localStorage.setItem('studentLeaves', JSON.stringify(leaves));
            
            // Update student record
            const student = getStudentById(leave.studentId);
            if (student) {
                student.leave.approvalStatus = approvalStatus;
                student.leave.leaveLetterReceived = leaveLetterReceived;
                saveStudentData(student);
            }
        }
    } else {
        const leaves = getTrainerLeaves();
        const leave = leaves.find(l => l.id === leaveId);
        if (leave) {
            leave.status = approvalStatus;
            const index = leaves.findIndex(l => l.id === leaveId);
            if (index >= 0) {
                leaves[index] = leave;
            }
            localStorage.setItem('trainerLeaves', JSON.stringify(leaves));
        }
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('updateLeaveModal'));
    modal.hide();
    loadLeaves();
    loadDashboard();
}

function callParent(studentId) {
    const student = getStudentById(studentId);
    if (student) {
        alert(`Calling parent of ${student.name}\nMobile: ${student.mobile}\n\n(Note: This is a demo. In production, this would initiate a call.)`);
    } else {
        alert(`Calling parent for ${studentId}\n\n(Note: This is a demo. In production, this would initiate a call.)`);
    }
}

