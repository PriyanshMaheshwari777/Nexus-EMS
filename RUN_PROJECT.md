# How to Run Nexus EMS Project

## Prerequisites
- Python 3.8+ installed
- Node.js and npm installed
- PostgreSQL database connection (already configured)

## Step-by-Step Instructions

### 1. Install Backend Dependencies

Open a terminal and run:
```bash
cd backend
pip install -r requirements.txt
```

Or if you have multiple Python versions:
```bash
python -m pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

Open a new terminal and run:
```bash
npm install
```

### 3. Start the Backend Server

In the backend directory:
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Or simply:
```bash
cd backend
python main.py
```

**Backend will run on:** http://localhost:8000
**API Documentation:** http://localhost:8000/docs

### 4. Start the Frontend Server

In the project root directory (in a new terminal):
```bash
npm run dev
```

**Frontend will run on:** http://localhost:5173

## Quick Start (Both Servers)

### Option 1: Manual (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Option 2: Using Scripts (Windows)

**Start Backend:**
```powershell
.\start-backend.ps1
```

**Start Frontend:**
```powershell
.\start-frontend.ps1
```

## Access the Application

1. **Frontend:** Open http://localhost:5173 in your browser
2. **Backend API:** http://localhost:8000
3. **API Docs:** http://localhost:8000/docs (Swagger UI)

## Default Login Credentials

### Admin Login
- **Email:** admin@nexus.com
- **Password:** admin

### Employee Login
- Create an employee through the admin panel first
- Then login with the employee's email and password

## Troubleshooting

### Backend won't start
- Check if port 8000 is already in use
- Verify Python dependencies are installed
- Check database connection in `backend/database.py`

### Frontend won't start
- Check if port 5173 is already in use
- Verify node_modules are installed (`npm install`)
- Check if backend is running on port 8000

### Database Connection Issues
- Verify the connection string in `backend/database.py`
- Run `python backend/check_db.py` to test connection

## Check Database

To view database contents:
```bash
cd backend
python check_db.py
```

## Stop the Servers

- **Backend:** Press `Ctrl+C` in the backend terminal
- **Frontend:** Press `Ctrl+C` in the frontend terminal

Or kill all Python/Node processes:
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*python*" -or $_.ProcessName -like "*node*"} | Stop-Process
```

