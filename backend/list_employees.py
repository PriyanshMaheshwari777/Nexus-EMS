from sqlalchemy.orm import Session
from database import SessionLocal, EmployeeDB

def list_employees():
    db = SessionLocal()
    employees = db.query(EmployeeDB).all()
    print(f"Total Employees: {len(employees)}")
    print("-" * 30)
    for emp in employees:
        print(f"ID: {emp.id} | Name: {emp.full_name} | Email: {emp.email}")
    db.close()

if __name__ == "__main__":
    list_employees()
