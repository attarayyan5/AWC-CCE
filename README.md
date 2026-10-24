# AWS Attendance Management System

A full-stack enterprise attendance management system built with **Node.js, Express, MongoDB** (backend) and **React 18 + Vite** (frontend), designed for deployment on **AWS**.

---

## 🚀 Key Features Implemented

1. **No Rate Limiting**
   - All rate limiting middleware has been completely removed to allow unrestricted API access.
2. **Admin Registration & Authentication**
   - Built-in `POST /api/auth/register` to create new admin accounts.
   - Secure JWT token authentication with bcrypt password hashing (10 rounds).
   - Profile retrieval via `GET /api/auth/profile`.
3. **Attendance Management Module**
   - **Daily Attendance Dashboard**: View real-time status of all employees with date navigation (prev/next day, calendar picker, today).
   - **Quick Actions**: One-click "Present", "Late", "Absent" marking directly from the table rows.
   - **Single & Bulk Attendance Recording**: Mark individual attendance with custom clock-in/out times, or bulk-mark entire departments at once.
   - **Inline Edit & Delete**: Adjust attendance status, clock times, and justification notes via modal.
   - **Summary Chips**: Instant overview of Present, Late, Absent, Half-Day, On-Leave, and Unmarked staff.
   - **Attendance Reports & Analytics**: Filter by employee, date ranges (Today, This Week, This Month, Last 30 Days, Custom), calculate work hours, view attendance rates, and export CSV reports.
4. **Employee Management**
   - Full CRUD operations: Add, list, search, filter by department, edit, and soft delete.
5. **Dashboard Overview**
   - Real-time statistics: Total employees, Present Today, Absent Today, Late Today, Attendance Rate (%).

---

## 📂 Project Architecture

```
FinalAws/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                      # MongoDB connection setup
│   │   ├── controllers/
│   │   │   ├── authController.js          # Admin register, login & profile
│   │   │   ├── employeeController.js      # Employee CRUD operations
│   │   │   └── attendanceController.js    # Attendance marking, stats, reports
│   │   ├── middleware/
│   │   │   └── authMiddleware.js          # JWT verification (No rate limiters)
│   │   ├── models/
│   │   │   ├── Admin.js                   # Admin schema with bcrypt hooks
│   │   │   ├── Employee.js                # Employee schema
│   │   │   └── Attendance.js              # Attendance schema with unique compound index
│   │   ├── routes/
│   │   │   ├── authRoutes.js              # /api/auth/register, /login, /profile
│   │   │   ├── employeeRoutes.js          # /api/employees
│   │   │   └── attendanceRoutes.js        # /api/attendance
│   │   └── server.js                      # Express app entry point
│   ├── .env                               # Server configuration
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx                 # Sidebar layout wrapper
    │   │   ├── Navbar.jsx                 # Top navigation bar
    │   │   ├── PrivateRoute.jsx           # Protected route guard
    │   │   └── Sidebar.jsx                # Modern dark sidebar with icons
    │   ├── context/
    │   │   └── AuthContext.jsx            # Auth state provider (login, register, logout)
    │   ├── pages/
    │   │   ├── Dashboard.jsx              # Stat cards & overview
    │   │   ├── Employees.jsx              # Employee table, search, filters
    │   │   ├── AddEmployee.jsx            # Add employee form
    │   │   ├── EditEmployee.jsx           # Edit employee form
    │   │   ├── Attendance.jsx             # Daily attendance module with quick actions
    │   │   ├── MarkAttendance.jsx         # Single & Bulk attendance marking
    │   │   ├── AttendanceReport.jsx       # Reports, analytics & CSV export
    │   │   ├── Login.jsx                  # Admin login page
    │   │   └── Register.jsx               # Admin registration page
    │   ├── services/
    │   │   └── api.js                     # Axios instance with auth interceptor
    │   ├── styles/
    │   │   └── index.css                  # Modern UI stylesheet
    │   ├── App.jsx                        # Route definitions
    │   └── main.jsx                       # React entry point
    ├── index.html
    ├── vite.config.js                     # Vite configuration with /api proxy
    └── package.json
```

---

## 🛠️ Getting Started

### 1. Setup Backend

```bash
cd backend
npm install
```

Configure your MongoDB URI in `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/attendance_db?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
```

Start the backend server:
```bash
npm run dev
# Server will run at http://localhost:5000
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend will run at http://localhost:5173
```

### 3. Registering the First Admin
1. Open `http://localhost:5173/register` in your browser.
2. Enter your Full Name, Email, and Password.
3. Click **Register** — you will immediately be logged in and redirected to the Dashboard!

---

## ☁️ AWS Deployment Notes

- **Compute**: Deploy the backend on **AWS EC2** or **AWS Elastic Beanstalk** using Node.js 18+. Use **PM2** (`pm2 start src/server.js`) for process management.
- **Database**: Use **AWS DocumentDB** or **MongoDB Atlas** with VPC peering or IP allowlisting.
- **Frontend**: Build the static bundle (`npm run build`) and host on **AWS S3 + CloudFront** or **AWS Amplify**.
