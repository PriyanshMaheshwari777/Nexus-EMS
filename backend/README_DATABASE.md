# Database Management Guide

## How to Check the Database

### Method 1: Using the Check Script (Recommended)
```bash
cd backend
python check_db.py
```

This script will show:
- Database connection status
- Available tables
- Employee count and list
- Leave applications count and list

### Method 2: Using Python Interactive Shell
```bash
cd backend
python
```

Then in Python:
```python
from database import SessionLocal, EmployeeDB, LeaveApplicationDB

# Get database session
db = SessionLocal()

# Count employees
employee_count = db.query(EmployeeDB).count()
print(f"Total employees: {employee_count}")

# List all employees
employees = db.query(EmployeeDB).all()
for emp in employees:
    print(f"{emp.id}: {emp.full_name} - {emp.email}")

# Count leave applications
leave_count = db.query(LeaveApplicationDB).count()
print(f"Total leaves: {leave_count}")

# Close session
db.close()
```

### Method 3: Using psql (PostgreSQL CLI)
If you have `psql` installed:
```bash
psql "postgresql://neondb_owner:npg_xzPjuQn42XiC@ep-rapid-scene-ahchywtp-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

Then run SQL queries:
```sql
-- List all employees
SELECT * FROM nexus_employees;

-- Count employees
SELECT COUNT(*) FROM nexus_employees;

-- List all leave applications
SELECT * FROM nexus_leave_applications;

-- Find employee by email
SELECT * FROM nexus_employees WHERE email = 'admin@nexus.com';
```

### Method 4: Using Neon Dashboard
1. Go to your Neon project dashboard
2. Navigate to the SQL Editor
3. Run queries directly in the browser

## Database Tables

### nexus_employees
- `id` - Primary key
- `full_name` - Employee full name
- `email` - Unique email address
- `phone` - Phone number
- `department` - Department name
- `designation` - Job title
- `salary` - Annual salary
- `joining_date` - Date joined
- `status` - Active/On Leave/Terminated
- `performance_score` - Performance rating (0-100)
- `attrition_risk` - Low/Medium/High
- `address` - Address (optional)
- `dob` - Date of birth (optional)
- `password` - Login password

### nexus_leave_applications
- `id` - Primary key
- `employee_id` - Foreign key to nexus_employees
- `employee_name` - Employee name
- `leave_type` - Sick/Casual/Earned/Maternity
- `start_date` - Leave start date
- `end_date` - Leave end date
- `reason` - Reason for leave
- `status` - Pending/Approved/Rejected
- `ai_recommendation` - AI-generated recommendation

## Common Queries

### Add a test employee (via Python)
```python
from database import SessionLocal, EmployeeDB
from datetime import date

db = SessionLocal()
new_emp = EmployeeDB(
    full_name="Test User",
    email="test@nexus.com",
    phone="1234567890",
    department="Engineering",
    designation="Developer",
    salary=80000.0,
    joining_date=date.today(),
    status="Active",
    performance_score=85,
    attrition_risk="Low",
    password="test123"
)
db.add(new_emp)
db.commit()
db.close()
```

### Delete all employees (use with caution!)
```python
from database import SessionLocal, EmployeeDB

db = SessionLocal()
db.query(EmployeeDB).delete()
db.commit()
db.close()
```

## Connection String
The database connection string is stored in `backend/database.py`:
```
postgresql://neondb_owner:npg_xzPjuQn42XiC@ep-rapid-scene-ahchywtp-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

