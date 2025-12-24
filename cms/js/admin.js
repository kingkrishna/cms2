// Admin Dashboard Functionality
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkAuth();
    if (!currentUser) return;
    
    if (currentUser.role !== 'admin') {
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
    loadClasses();
    loadCanteen();
    loadHostel();
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
            case 'students':
                loadStudents();
                break;
            case 'trainers':
                loadClasses();
                break;
            case 'leaves':
                loadLeaves();
                break;
            case 'canteen':
                loadCanteen();
                break;
            case 'hostel':
                loadHostel();
                break;
        }
    }
}

function loadDashboard() {
    const students = getStudents();
    const trainers = JSON.parse(localStorage.getItem('trainers') || '[]');
    
    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('totalTrainers').textContent = trainers.length;
    
    const hostelStudents = students.filter(s => s.hostelStatus === 'Yes').length;
    document.getElementById('hostelStudents').textContent = hostelStudents;
    
    const completedAttendance = students.filter(s => 
        s.attendance && s.attendance.onlineClassCompleted && s.attendance.offlineRecordsReceived
    ).length;
    const attendanceRate = students.length > 0 ? Math.round((completedAttendance / students.length) * 100) : 0;
    document.getElementById('attendanceRate').textContent = attendanceRate + '%';
    
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
                <button class="btn btn-sm btn-danger" onclick="deleteStudentConfirm('${student.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
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

function loadClasses() {
    const allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
    const tbody = document.getElementById('classesTableBody');
    
    if (allClasses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No classes found</td></tr>';
        return;
    }
    
    tbody.innerHTML = allClasses.map(cls => `
        <tr>
            <td>${cls.name}</td>
            <td>${cls.schedule}</td>
            <td>${cls.batch}</td>
            <td>${cls.trainerId || 'Not Assigned'}</td>
            <td><span class="badge bg-success">Active</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editClass('${cls.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteClass('${cls.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddClassModal() {
    document.getElementById('addClassForm').reset();
    document.getElementById('classId').value = '';
    const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
    modal.show();
}

function saveClass() {
    const classId = document.getElementById('classId').value;
    const className = document.getElementById('className').value;
    const schedule = document.getElementById('classSchedule').value;
    const batch = document.getElementById('classBatch').value;
    const trainerId = document.getElementById('classTrainerId').value;
    
    const allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
    
    if (classId) {
        // Edit existing
        const index = allClasses.findIndex(c => c.id === classId);
        if (index >= 0) {
            allClasses[index] = {
                id: classId,
                name: className,
                schedule: schedule,
                batch: batch,
                trainerId: trainerId
            };
        }
    } else {
        // Add new
        const newClass = {
            id: 'CLASS' + Date.now(),
            name: className,
            schedule: schedule,
            batch: batch,
            trainerId: trainerId
        };
        allClasses.push(newClass);
    }
    
    localStorage.setItem('allClasses', JSON.stringify(allClasses));
    const modal = bootstrap.Modal.getInstance(document.getElementById('addClassModal'));
    modal.hide();
    loadClasses();
}

function editClass(id) {
    const allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
    const cls = allClasses.find(c => c.id === id);
    if (!cls) return;
    
    document.getElementById('classId').value = cls.id;
    document.getElementById('className').value = cls.name;
    document.getElementById('classSchedule').value = cls.schedule;
    document.getElementById('classBatch').value = cls.batch;
    document.getElementById('classTrainerId').value = cls.trainerId || '';
    
    const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
    modal.show();
}

function deleteClass(id) {
    if (confirm('Are you sure you want to delete this class?')) {
        const allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
        const filtered = allClasses.filter(c => c.id !== id);
        localStorage.setItem('allClasses', JSON.stringify(filtered));
        loadClasses();
    }
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
    const countHtml = `
        <div class="mb-2">
            <strong>Tiffin (Morning):</strong> ${menu.morning.selectedCount} selections
        </div>
        <div class="mb-2">
            <strong>Dinner (Night):</strong> ${menu.night.selectedCount} selections
        </div>
        <div class="alert alert-info mt-3">
            <small>These counts include both student and trainer selections for food preparation planning.</small>
        </div>
    `;
    document.getElementById('foodCountDisplay').innerHTML = countHtml;
}

function loadHostel() {
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    const countHtml = `
        <div class="mb-2">
            <strong>Tiffin (Morning):</strong> ${menu.morning.selectedCount} selections
        </div>
        <div class="mb-2">
            <strong>Dinner (Night):</strong> ${menu.night.selectedCount} selections
        </div>
        <div class="alert alert-info mt-3">
            <small>These counts include both student and trainer selections for food preparation planning.</small>
        </div>
    `;
    document.getElementById('hostelFoodCountDisplay').innerHTML = countHtml;
}

function loadLeaves() {
    // Show only Level 2 approved leaves (awaiting final admin approval)
    const leaves = getStudentLeaves();
    const level2Leaves = leaves.filter(l => l.approvalLevel === 2 && l.approvalStatus !== 'Rejected');
    const tbody = document.getElementById('leavesTableBody');
    
    if (level2Leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No Level 2 approved leaves awaiting final approval</td></tr>';
        return;
    }
    
    tbody.innerHTML = level2Leaves.map(leave => `
        <tr>
            <td>${leave.studentId || leave.studentName}</td>
            <td>${leave.fromDate}</td>
            <td>${leave.toDate}</td>
            <td>${leave.reason}</td>
            <td><span class="badge ${leave.parentContacted ? 'bg-success' : 'bg-warning'}">${leave.parentContacted ? 'Yes' : 'No'}</span></td>
            <td><span class="badge ${leave.leaveLetterReceived ? 'bg-success' : 'bg-danger'}">${leave.leaveLetterReceived ? 'Yes' : 'No'}</span></td>
            <td><span class="badge bg-primary">Level 2 Approved</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewLeaveDetails('${leave.id}')">
                    <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-success" onclick="approveLeaveLevel3('${leave.id}')">
                    <i class="bi bi-check-circle"></i> Final Approve
                </button>
                <button class="btn btn-sm btn-danger" onclick="rejectLeave('${leave.id}')">
                    <i class="bi bi-x-circle"></i> Reject
                </button>
            </td>
        </tr>
    `).join('');
}

function viewLeaveDetails(leaveId) {
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return;
    
    let details = `Leave Details:\n\nStudent: ${leave.studentName} (${leave.studentId})\nFrom: ${leave.fromDate}\nTo: ${leave.toDate}\nReason: ${leave.reason}\nApplied: ${leave.appliedDate}\n\n`;
    details += `Approval History:\n`;
    if (leave.trainerApproved) {
        details += `Level 1: Trainer Approved\n`;
        details += `  Approved by: ${leave.trainerApprovedBy || 'N/A'}\n`;
        details += `  Date: ${leave.trainerApprovedDate || 'N/A'}\n`;
    }
    if (leave.misApproved) {
        details += `Level 2: MIS Approved\n`;
        details += `  Approved by: ${leave.misApprovedBy || 'N/A'}\n`;
        details += `  Date: ${leave.misApprovedDate || 'N/A'}\n`;
        details += `  Parent Contacted: ${leave.parentContacted ? 'Yes' : 'No'}\n`;
    }
    details += `\nAwaiting Level 3: Final Admin Approval`;
    
    alert(details);
}

function approveLeaveLevel3(leaveId) {
    if (!confirm('Approve this leave at Level 3 (Final Approval)? This will complete the approval process.')) {
        return;
    }
    
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return;
    
    leave.approvalLevel = 3;
    leave.adminApproved = true;
    leave.adminApprovedBy = currentUser.name;
    leave.adminApprovedDate = new Date().toISOString().split('T')[0];
    leave.approvalStatus = 'Approved';
    
    const index = leaves.findIndex(l => l.id === leaveId);
    if (index >= 0) {
        leaves[index] = leave;
    }
    localStorage.setItem('studentLeaves', JSON.stringify(leaves));
    
    loadLeaves();
    loadDashboard();
    alert('Leave approved at Level 3 (Final). The leave application is now fully approved.');
}

function rejectLeave(leaveId) {
    if (!confirm('Reject this leave application? This will reject it at all levels.')) {
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

function deleteStudentConfirm(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        deleteStudent(id);
        loadStudents();
        loadDashboard();
    }
}

