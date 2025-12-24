# Training Institute CMS

A role-based Content Management System for training institutes with hostel and canteen operations.

## Features

### Module 1: Admin/Manager
- Full system control and access
- Manage students, trainers, users, and roles
- View all dashboards and reports
- Complete data management capabilities

### Module 2: Trainer
- Academic and student monitoring
- Manage classes and schedules
- Apply for leave with document upload
- View student profiles and attendance (read-only)

### Module 3: MIS
- Complete student record management
- Update attendance and student status
- Process student and trainer leave applications
- View hostel and canteen information
- Track compliance and verification

## Login Credentials

### Admin/Manager
- Username: `admin`
- Password: `admin123`
- Role: Admin / Manager

### Trainer
- Username: `trainer`
- Password: `trainer123`
- Role: Trainer

### MIS
- Username: `mis`
- Password: `mis123`
- Role: MIS

## Getting Started

1. Open `index.html` in a web browser
2. Enter your credentials and select your role
3. Click Login to access your dashboard

## Technology Stack

- HTML5
- Bootstrap 5.3.0
- JavaScript (Vanilla)
- Bootstrap Icons
- LocalStorage for data persistence

## Color Palette

- Primary Blue: #0d6efd
- Secondary Blue: #0dcaf0
- Primary Green: #198754
- Secondary Green: #20c997

## File Structure

```
cms/
├── index.html              # Login page
├── admin-dashboard.html    # Admin dashboard
├── trainer-dashboard.html # Trainer dashboard
├── mis-dashboard.html      # MIS dashboard
├── css/
│   └── style.css          # Custom styles
├── js/
│   ├── auth.js            # Authentication
│   ├── data.js            # Data management
│   ├── admin.js           # Admin functionality
│   ├── trainer.js         # Trainer functionality
│   └── mis.js             # MIS functionality
└── README.md              # This file
```

## Features Overview

### Student Management
- Add, edit, and view student records
- Track student ID, name, mobile, batch, and hostel status
- Manage attendance records

### Attendance Tracking
- Online class completion status
- Offline records receipt status
- View and update attendance records

### Leave Management
- Student leave applications
- Trainer leave applications
- Leave approval workflow
- Leave letter tracking

### Hostel Management
- View hostel student information
- Track in-time and out-time
- Monitor leave letters

### Canteen Management
- View daily food menus (morning and night)
- Track food selection counts
- View stock quantities

## Notes

- All data is stored in browser's LocalStorage
- Data persists across sessions
- Each role has specific access permissions
- Food menu and selection counts are automatically calculated

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Edge
- Safari

