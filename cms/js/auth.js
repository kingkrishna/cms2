// Authentication and Session Management
const users = {
    admin: { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin Manager' },
    trainer: { username: 'trainer', password: 'trainer123', role: 'trainer', name: 'John Trainer' },
    mis: { username: 'mis', password: 'mis123', role: 'mis', name: 'MIS Officer' },
    student: { username: 'STU001', password: 'student123', role: 'student', name: 'Rajesh Kumar', studentId: 'STU001' }
};

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    const errorAlert = document.getElementById('errorAlert');
    
    // Validate role selection
    if (!role) {
        errorAlert.textContent = 'Please select a role';
        errorAlert.classList.remove('d-none');
        return;
    }
    
    // Check if user exists and credentials match
    let user = users[role];
    
    // For students, check against student records
    if (role === 'student') {
        // Import getStudents function from data.js (will be available after data.js loads)
        if (typeof getStudents === 'function') {
            const students = getStudents();
            const student = students.find(s => s.id === username);
            if (student && username === student.id && password === 'student123') {
                user = {
                    username: student.id,
                    role: 'student',
                    name: student.name,
                    studentId: student.id
                };
            } else {
                user = null;
            }
        } else {
            // Fallback for initial load
            if (username === 'STU001' && password === 'student123') {
                user = {
                    username: 'STU001',
                    role: 'student',
                    name: 'Rajesh Kumar',
                    studentId: 'STU001'
                };
            } else {
                user = null;
            }
        }
    }
    
    if (user && user.username === username && (role !== 'student' || password === 'student123')) {
        // Store session
        sessionStorage.setItem('currentUser', JSON.stringify({
            username: user.username,
            role: user.role,
            name: user.name,
            studentId: user.studentId || user.username
        }));
        
        // Redirect based on role
        switch(role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'trainer':
                window.location.href = 'trainer-dashboard.html';
                break;
            case 'mis':
                window.location.href = 'mis-dashboard.html';
                break;
            case 'student':
                window.location.href = 'student-dashboard.html';
                break;
        }
    } else {
        errorAlert.textContent = 'Invalid username, password, or role mismatch';
        errorAlert.classList.remove('d-none');
    }
});

// Check if user is logged in (for dashboard pages)
function checkAuth() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// Logout function
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

