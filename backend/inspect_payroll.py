from database import SessionLocal, PayrollRecordDB
from sqlalchemy import text, inspect
import datetime

def debug_payroll():
    db = SessionLocal()
    try:
        # Check table columns
        print("Checking nexus_payroll_records schema...")
        inspector = inspect(db.bind)
        columns = inspector.get_columns('nexus_payroll_records')
        for col in columns:
            print(f" - {col['name']} ({col['type']})")

        # Try to insert a dummy record
        print("\nAttempting to insert dummy payroll record...")
        record = PayrollRecordDB(
            employee_id=999,
            employee_name="Test User",
            month="December",
            year=2025,
            basic_salary=1000.0,
            hra=400.0,
            allowances=100.0,
            deductions=150.0,
            net_salary=1350.0,
            status="Processing",
            released="No"
        )
        db.add(record)
        
        # Try to insert dummy notification (mimicking run_payroll)
        from database import NotificationDB
        print("Attempting to insert dummy notification...")
        notification = NotificationDB(
            user_id=999,
            user_type="EMPLOYEE",
            title="Payroll Processed",
            message=f"Your payroll for December 2025 has been processed. Net salary: ₹1,350.00",
            type="success",
            read="No",
            created_at=datetime.datetime.utcnow()
        )
        db.add(notification)
        
        db.commit()
        print("Insert successful!")
        
        # Cleanup
        db.delete(record)
        db.delete(notification)
        db.commit()
        print("Cleanup successful!")

    except Exception as e:
        print("\n[ERROR] SQL Execution Failed:")
        print(e)
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_payroll()
