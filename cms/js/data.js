// Data Storage and Management
// Using localStorage for data persistence

// Initialize data if not exists
function initializeData() {
    if (!localStorage.getItem('students')) {
        localStorage.setItem('students', JSON.stringify([
            {
                id: 'STU001',
                name: 'Rajesh Kumar',
                mobile: '9876543210',
                parentNumber: '9876543200',
                batchNumber: 'BATCH2024-01',
                currentBatch: 'Full Stack Development',
                currentBatchId: 'BATCH2024-01',
                hostelStatus: 'Yes',
                location: 'Delhi',
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
            },
            {
                id: 'STU002',
                name: 'Priya Sharma',
                mobile: '9876543211',
                parentNumber: '9876543201',
                batchNumber: 'BATCH2024-01',
                currentBatch: 'Full Stack Development',
                currentBatchId: 'BATCH2024-01',
                hostelStatus: 'Yes',
                location: 'Mumbai',
                attendance: {
                    onlineClassCompleted: true,
                    offlineRecordsReceived: true
                },
                leave: {
                    approvalStatus: 'Approved',
                    leaveLetterReceived: true
                },
                hostel: {
                    inTime: '08:00',
                    outTime: '18:00',
                    movementHistory: []
                },
                foodSelection: {}
            }
        ]));
    }
    
    if (!localStorage.getItem('trainers')) {
        localStorage.setItem('trainers', JSON.stringify([
            {
                id: 'TRN001',
                name: 'John Trainer',
                email: 'john@institute.com',
                classes: ['Full Stack Development', 'Data Science'],
                leaveApplications: []
            }
        ]));
    }
    
    if (!localStorage.getItem('trainerLeaves')) {
        localStorage.setItem('trainerLeaves', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('studentLeaves')) {
        localStorage.setItem('studentLeaves', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('foodMenu')) {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('foodMenu', JSON.stringify({
            [today]: {
                morning: {
                    items: ['Idli', 'Sambar', 'Chutney'],
                    selectedCount: 0
                },
                night: {
                    items: ['Rice', 'Dal', 'Vegetable Curry', 'Roti'],
                    selectedCount: 0
                }
            }
        }));
    }
    
    if (!localStorage.getItem('canteenStock')) {
        localStorage.setItem('canteenStock', JSON.stringify([
            { item: 'Rice', quantity: 50, unit: 'kg' },
            { item: 'Dal', quantity: 20, unit: 'kg' },
            { item: 'Vegetables', quantity: 30, unit: 'kg' },
            { item: 'Oil', quantity: 10, unit: 'liters' }
        ]));
    }
}

// Get all students
function getStudents() {
    return JSON.parse(localStorage.getItem('students') || '[]');
}

// Get student by ID
function getStudentById(id) {
    const students = getStudents();
    return students.find(s => s.id === id);
}

// Save student
function saveStudent(student) {
    const students = getStudents();
    const index = students.findIndex(s => s.id === student.id);
    if (index >= 0) {
        students[index] = student;
    } else {
        students.push(student);
    }
    localStorage.setItem('students', JSON.stringify(students));
}

// Delete student
function deleteStudent(id) {
    const students = getStudents();
    const filtered = students.filter(s => s.id !== id);
    localStorage.setItem('students', JSON.stringify(filtered));
}

// Get trainer leaves
function getTrainerLeaves() {
    return JSON.parse(localStorage.getItem('trainerLeaves') || '[]');
}

// Save trainer leave
function saveTrainerLeave(leave) {
    const leaves = getTrainerLeaves();
    leaves.push(leave);
    localStorage.setItem('trainerLeaves', JSON.stringify(leaves));
}

// Get student leaves
function getStudentLeaves() {
    return JSON.parse(localStorage.getItem('studentLeaves') || '[]');
}

// Save student leave
function saveStudentLeave(leave) {
    const leaves = getStudentLeaves();
    const index = leaves.findIndex(l => l.id === leave.id);
    if (index >= 0) {
        leaves[index] = leave;
    } else {
        leaves.push(leave);
    }
    localStorage.setItem('studentLeaves', JSON.stringify(leaves));
}

// Get food menu
function getFoodMenu(date) {
    const menus = JSON.parse(localStorage.getItem('foodMenu') || '{}');
    return menus[date] || { morning: { items: [], selectedCount: 0 }, night: { items: [], selectedCount: 0 } };
}

// Save food menu
function saveFoodMenu(date, menu) {
    const menus = JSON.parse(localStorage.getItem('foodMenu') || '{}');
    menus[date] = menu;
    localStorage.setItem('foodMenu', JSON.stringify(menus));
}

// Get food selections for a date
function getFoodSelections(date) {
    const selections = JSON.parse(localStorage.getItem('foodSelections') || '{}');
    return selections[date] || {};
}

// Save food selection for a student
function saveFoodSelection(studentId, date, morning, night) {
    const selections = JSON.parse(localStorage.getItem('foodSelections') || '{}');
    if (!selections[date]) {
        selections[date] = {};
    }
    selections[date][studentId] = {
        morning: morning, // 'eat' or 'not eat'
        night: night // 'eat' or 'not eat'
    };
    localStorage.setItem('foodSelections', JSON.stringify(selections));
    
    // Update counts
    updateFoodCounts(date);
}

// Update food selection counts
function updateFoodCounts(date) {
    const selections = getFoodSelections(date);
    const students = getStudents();
    const trainerSelections = JSON.parse(localStorage.getItem('trainerFoodSelections') || '{}');
    const dateTrainerSelections = trainerSelections[date] || {};
    
    let morningCount = 0;
    let nightCount = 0;
    
    // Count student selections
    students.forEach(student => {
        const selection = selections[student.id];
        if (selection) {
            if (selection.morning === 'eat') morningCount++;
            if (selection.night === 'eat') nightCount++;
        }
    });
    
    // Count trainer selections
    Object.keys(dateTrainerSelections).forEach(trainerId => {
        const selection = dateTrainerSelections[trainerId];
        if (selection.morning === 'eat') morningCount++;
        if (selection.night === 'eat') nightCount++;
    });
    
    const menu = getFoodMenu(date);
    menu.morning.selectedCount = morningCount;
    menu.night.selectedCount = nightCount;
    saveFoodMenu(date, menu);
}

// Get canteen stock
function getCanteenStock() {
    return JSON.parse(localStorage.getItem('canteenStock') || '[]');
}

// Save canteen stock
function saveCanteenStock(stock) {
    localStorage.setItem('canteenStock', JSON.stringify(stock));
}

// Initialize on load
initializeData();

