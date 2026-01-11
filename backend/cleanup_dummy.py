from sqlalchemy.orm import Session
from database import SessionLocal, EmployeeDB, TaskDB, LeaveApplicationDB, NotificationDB, PayrollRecordDB

def cleanup_dummy_data():
    db = SessionLocal()
    
    # List of dummy names from seed_data.py
    dummy_names = [
        "Aarav Sharma", "Vivaan Gupta", "Aditya Patel", "Vihaan Singh", "Arjun Reddy",
        "Sai Kumar", "Reyansh Verma", "Ayaan Das", "Krishna Iyer", "Ishaan Nair",
        "Diya Menon", "Saanvi Rao", "Ananya Chatterjee", "Pari Joshi", "Myra Kapoor"
    ]
    
    print(f"Cleaning up {len(dummy_names)} dummy profiles...")
    
    deleted_count = 0
    
    for name in dummy_names:
        # Find employee
        employee = db.query(EmployeeDB).filter(EmployeeDB.full_name == name).first()
        
        if employee:
            emp_id = employee.id
            print(f"Deleting dummy data for: {name} (ID: {emp_id})")
            
            # Delete related data
            db.query(TaskDB).filter(TaskDB.employee_id == emp_id).delete()
            db.query(LeaveApplicationDB).filter(LeaveApplicationDB.employee_id == emp_id).delete()
            db.query(PayrollRecordDB).filter(PayrollRecordDB.employee_id == emp_id).delete()
            db.query(NotificationDB).filter(NotificationDB.user_id == emp_id).delete()
            
            # Delete employee
            db.delete(employee)
            deleted_count += 1
            
    db.commit()
    print("-" * 30)
    print(f"Cleanup Complete. Removed {deleted_count} dummy profiles.")
    
    # Show remaining
    remaining = db.query(EmployeeDB).all()
    print(f"Remaining Employees: {len(remaining)}")
    for emp in remaining:
        print(f"  - {emp.full_name} ({emp.email})")

    db.close()

if __name__ == "__main__":
    cleanup_dummy_data()
