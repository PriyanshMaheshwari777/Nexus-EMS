"""
Script to check and view database contents
"""
from database import SessionLocal, EmployeeDB, LeaveApplicationDB
from sqlalchemy import inspect, text

def check_database():
    """Check database connection and show data"""
    db = SessionLocal()
    
    try:
        # Test connection
        result = db.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        print("=" * 60)
        print("DATABASE CONNECTION STATUS")
        print("=" * 60)
        print("[OK] Connected to PostgreSQL")
        print(f"  Version: {version[:50]}...")
        print()
        
        # Check tables
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        print("=" * 60)
        print("AVAILABLE TABLES")
        print("=" * 60)
        for table in tables:
            if 'nexus' in table.lower():
                print(f"  [OK] {table}")
        print()
        
        # Check employees
        employee_count = db.query(EmployeeDB).count()
        print("=" * 60)
        print(f"EMPLOYEES TABLE (nexus_employees)")
        print("=" * 60)
        print(f"Total employees: {employee_count}")
        
        if employee_count > 0:
            print("\nEmployee List:")
            employees = db.query(EmployeeDB).all()
            for emp in employees:
                print(f"  - ID: {emp.id} | {emp.full_name} | {emp.email} | {emp.department}")
        else:
            print("  (No employees in database)")
        print()
        
        # Check leaves
        leave_count = db.query(LeaveApplicationDB).count()
        print("=" * 60)
        print(f"LEAVE APPLICATIONS TABLE (nexus_leave_applications)")
        print("=" * 60)
        print(f"Total leave applications: {leave_count}")
        
        if leave_count > 0:
            print("\nLeave Applications:")
            leaves = db.query(LeaveApplicationDB).all()
            for leave in leaves:
                print(f"  - ID: {leave.id} | Employee: {leave.employee_name} | Type: {leave.leave_type} | Status: {leave.status}")
        else:
            print("  (No leave applications in database)")
        print()
        
        print("=" * 60)
        print("DATABASE CHECK COMPLETE")
        print("=" * 60)
        
    except Exception as e:
        print(f"[ERROR] {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_database()

