from database import SessionLocal, EmployeeDB, TaskDB

def check_data():
    db = SessionLocal()
    emp_count = db.query(EmployeeDB).count()
    task_count = db.query(TaskDB).count()
    print(f"Employees: {emp_count}")
    print(f"Tasks: {task_count}")
    
    if emp_count > 0:
        first = db.query(EmployeeDB).first()
        print(f"First Employee: {first.full_name} ({first.email})")

if __name__ == "__main__":
    check_data()
