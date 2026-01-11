from sqlalchemy.orm import Session
from database import SessionLocal, init_db, EmployeeDB, LeaveApplicationDB, TaskDB, PayrollRecordDB
from datetime import date, datetime, timedelta
import random

def seed_data():
    db = SessionLocal()
    
    # 1. Create Employees
    departments = ["Engineering", "Sales", "Marketing", "HR", "Management"]
    designations = {
        "Engineering": ["Software Engineer", "Senior Developer", "DevOps Engineer", "QA Engineer"],
        "Sales": ["Sales Executive", "Sales Manager", "Account Manager"],
        "Marketing": ["Content Writer", "Marketing Lead", "SEO Specialist"],
        "HR": ["HR Manager", "Recruiter"],
        "Management": ["Product Manager", "CTO", "CEO"]
    }
    
    names = [
        "Aarav Sharma", "Vivaan Gupta", "Aditya Patel", "Vihaan Singh", "Arjun Reddy",
        "Sai Kumar", "Reyansh Verma", "Ayaan Das", "Krishna Iyer", "Ishaan Nair",
        "Diya Menon", "Saanvi Rao", "Ananya Chatterjee", "Pari Joshi", "Myra Kapoor"
    ]
    
    print("Creating Employees...")
    created_employees = []
    for i, name in enumerate(names):
        dept = random.choice(departments)
        desig = random.choice(designations[dept])
        
        email = f"{name.lower().replace(' ', '.')}@nexus.com"
        
        # Check if exists
        if db.query(EmployeeDB).filter(EmployeeDB.email == email).first():
            continue
            
        emp = EmployeeDB(
            full_name=name,
            email=email,
            phone=f"98{random.randint(10000000, 99999999)}",
            department=dept,
            designation=desig,
            salary=random.randint(500000, 3000000),
            joining_date=date.today() - timedelta(days=random.randint(100, 1000)),
            status="Active",
            performance_score=random.randint(60, 100),
            attrition_risk=random.choice(["Low", "Low", "Low", "Medium", "High"]),
            password="password123", # Default
            address="123, Tech Park, Bangalore"
        )
        db.add(emp)
        created_employees.append(emp)
    
    db.commit()
    
    # Reload employees to get IDs
    employees = db.query(EmployeeDB).all()
    
    if not employees:
        print("No employees created.")
        return

    print("Creating Leaves...")
    leave_types = ["Sick Leave", "Casual Leave", "Privilege Leave"]
    for _ in range(20):
        emp = random.choice(employees)
        start = date.today() + timedelta(days=random.randint(-30, 30))
        end = start + timedelta(days=random.randint(1, 5))
        
        leave = LeaveApplicationDB(
            employee_id=emp.id,
            employee_name=emp.full_name,
            leave_type=random.choice(leave_types),
            start_date=start,
            end_date=end,
            reason="Personal reasons",
            status=random.choice(["Pending", "Approved", "Rejected"]),
            ai_recommendation="Approved suggested"
        )
        db.add(leave)

    print("Creating Tasks...")
    for _ in range(15):
        emp = random.choice(employees)
        task = TaskDB(
            employee_id=emp.id,
            employee_name=emp.full_name,
            title=f"Complete Project Module {random.randint(1, 5)}",
            description="Finish the assigned module by end of week.",
            priority=random.choice(["High", "Medium", "Low"]),
            due_date=date.today() + timedelta(days=random.randint(1, 10)),
            created_by=1,
            status=random.choice(["Pending", "In Progress", "Completed"])
        )
        db.add(task)
        
    db.commit()
    print("Seed data injected successfully!")

if __name__ == "__main__":
    init_db()
    seed_data()
