from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func
import random
import pytz

from database import init_db, get_db, EmployeeDB, LeaveApplicationDB, PayrollRecordDB, NotificationDB, TaskDB

app = FastAPI(title="Nexus EMS API", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Nexus EMS Backend is running", "status": "active"}

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    print("Database initialized and tables created")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class DepartmentDist(BaseModel):
    name: str
    value: int

class DashboardStats(BaseModel):
    total_employees: int
    on_leave_today: int
    high_attrition_risk: int
    avg_performance: int
    department_dist: List[DepartmentDist]

class EmployeeCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    department: str
    designation: str
    salary: int
    joining_date: str
    password: str
    address: Optional[str] = None
    dob: Optional[str] = None

class LeaveCreate(BaseModel):
    employee_id: int
    leave_type: str
    start_date: str
    end_date: str
    reason: str

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class LoginResponse(BaseModel):
    success: bool
    role: Optional[str] = None
    email: Optional[str] = None
    message: str

class Employee(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    department: str
    designation: str
    joining_date: str
    salary: int
    status: str
    performance_score: Optional[int] = None
    attrition_risk: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[str] = None

    class Config:
        from_attributes = True

class LeaveApplication(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    leave_type: str
    start_date: str
    end_date: str
    reason: str
    status: str
    ai_recommendation: Optional[str] = None

    class Config:
        from_attributes = True

# Admin credentials
ADMIN_EMAILS = ["admin@nexus.com", "Priyansh@123"]
ADMIN_PASSWORDS = {"admin@nexus.com": "admin", "Priyansh@123": "123456"}

# Helper functions to convert DB models to Pydantic models
def employee_db_to_pydantic(emp_db: EmployeeDB) -> Employee:
    """Convert EmployeeDB to Employee Pydantic model"""
    return Employee(
        id=emp_db.id,
        full_name=emp_db.full_name,
        email=emp_db.email,
        phone=emp_db.phone,
        department=emp_db.department,
        designation=emp_db.designation,
        joining_date=emp_db.joining_date.strftime("%Y-%m-%d") if emp_db.joining_date else "",
        salary=int(emp_db.salary) if emp_db.salary else 0,
        status=emp_db.status,
        performance_score=emp_db.performance_score,
        attrition_risk=emp_db.attrition_risk,
        address=emp_db.address,
        dob=emp_db.dob.strftime("%Y-%m-%d") if emp_db.dob else None
    )

def leave_db_to_pydantic(leave_db: LeaveApplicationDB) -> LeaveApplication:
    """Convert LeaveApplicationDB to LeaveApplication Pydantic model"""
    return LeaveApplication(
        id=leave_db.id,
        employee_id=leave_db.employee_id,
        employee_name=leave_db.employee_name,
        leave_type=leave_db.leave_type,
        start_date=leave_db.start_date.strftime("%Y-%m-%d") if leave_db.start_date else "",
        end_date=leave_db.end_date.strftime("%Y-%m-%d") if leave_db.end_date else "",
        reason=leave_db.reason,
        status=leave_db.status,
        ai_recommendation=leave_db.ai_recommendation
    )

# Helper function to calculate dashboard stats
def calculate_dashboard_stats(db: Session) -> DashboardStats:
    total = db.query(EmployeeDB).count()
    
    # Count employees with high attrition risk
    high_risk = db.query(EmployeeDB).filter(EmployeeDB.attrition_risk == "High").count()
    
    # Calculate average performance
    avg_perf_result = db.query(func.avg(EmployeeDB.performance_score)).scalar()
    avg_perf = int(avg_perf_result) if avg_perf_result else 75
    
    # Count employees on leave today
    today = date.today()
    on_leave = db.query(LeaveApplicationDB).filter(
        LeaveApplicationDB.status == "Approved",
        LeaveApplicationDB.start_date <= today,
        LeaveApplicationDB.end_date >= today
    ).count()
    
    # Department distribution
    dept_counts = db.query(
        EmployeeDB.department,
        func.count(EmployeeDB.id).label('count')
    ).group_by(EmployeeDB.department).all()
    
    dept_dist = [DepartmentDist(name=dept, value=count) for dept, count in dept_counts]
    
    return DashboardStats(
        total_employees=total,
        on_leave_today=on_leave,
        high_attrition_risk=high_risk,
        avg_performance=avg_perf,
        department_dist=dept_dist
    )

# API Endpoints

@app.get("/")
def root():
    return {"message": "Nexus EMS API is running with PostgreSQL"}

@app.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    return calculate_dashboard_stats(db)

@app.delete("/payroll/{payroll_id}")
def delete_payroll_record(payroll_id: int, db: Session = Depends(get_db)):
    """Delete a payroll record"""
    record = db.query(PayrollRecordDB).filter(PayrollRecordDB.id == payroll_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    db.delete(record)
    db.commit()
    return {"message": "Payroll record deleted successfully"}

@app.get("/employees/", response_model=List[Employee])
def get_employees(db: Session = Depends(get_db)):
    """Get all employees"""
    employees = db.query(EmployeeDB).all()
    return [employee_db_to_pydantic(emp) for emp in employees]

@app.get("/employees/by-email/{email}", response_model=Employee)
def get_employee_by_email(email: str, db: Session = Depends(get_db)):
    """Get employee by email"""
    employee = db.query(EmployeeDB).filter(EmployeeDB.email == email).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee_db_to_pydantic(employee)

@app.post("/employees/", response_model=Employee)
def create_employee(emp: EmployeeCreate, db: Session = Depends(get_db)):
    """Create a new employee"""
    # Check if email already exists
    existing = db.query(EmployeeDB).filter(EmployeeDB.email == emp.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Calculate performance score and attrition risk (simplified logic)
    performance_score = random.randint(70, 95)
    attrition_risk = "Low" if performance_score > 85 else ("Medium" if performance_score > 75 else "High")
    
    # Parse dates
    joining_date = datetime.strptime(emp.joining_date, "%Y-%m-%d").date()
    dob = None
    if emp.dob:
        try:
            dob = datetime.strptime(emp.dob, "%Y-%m-%d").date()
        except:
            dob = None
    
    # Create new employee
    new_employee = EmployeeDB(
        full_name=emp.full_name,
        email=emp.email,
        phone=emp.phone,
        department=emp.department,
        designation=emp.designation,
        salary=float(emp.salary),
        joining_date=joining_date,
        status="Active",
        performance_score=performance_score,
        attrition_risk=attrition_risk,
        address=emp.address,
        dob=dob,
        password=emp.password  # In production, hash this password
    )
    
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    return employee_db_to_pydantic(new_employee)

@app.delete("/employees/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """Delete an employee"""
    employee = db.query(EmployeeDB).filter(EmployeeDB.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(employee)
    db.commit()
    
    return {"message": "Employee deleted successfully"}

@app.delete("/employees/cleanup/terminated")
def delete_terminated_employees(db: Session = Depends(get_db)):
    """Permanently delete all employees with 'Terminated' status"""
    deleted_count = db.query(EmployeeDB).filter(EmployeeDB.status == "Terminated").delete()
    db.commit()
    return {"message": f"Permanently deleted {deleted_count} terminated employees", "count": deleted_count}

@app.delete("/leaves/cleanup/rejected")
def delete_rejected_leaves(db: Session = Depends(get_db)):
    """Permanently delete all leave applications with 'Rejected' status"""
    deleted_count = db.query(LeaveApplicationDB).filter(LeaveApplicationDB.status == "Rejected").delete()
    db.commit()
    return {"message": f"Permanently deleted {deleted_count} rejected leave applications", "count": deleted_count}

@app.get("/leaves/", response_model=List[LeaveApplication])
def get_leaves(db: Session = Depends(get_db)):
    """Get all leave applications"""
    leaves = db.query(LeaveApplicationDB).all()
    return [leave_db_to_pydantic(leave) for leave in leaves]

@app.post("/leaves/", response_model=LeaveApplication)
def create_leave(leave: LeaveCreate, db: Session = Depends(get_db)):
    """Create a new leave application"""
    # Find employee
    employee = db.query(EmployeeDB).filter(EmployeeDB.id == leave.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Parse dates
    start_date = datetime.strptime(leave.start_date, "%Y-%m-%d").date()
    end_date = datetime.strptime(leave.end_date, "%Y-%m-%d").date()
    
    # Generate AI recommendation (simplified)
    ai_recommendation = "Balance Sufficient. Approve suggested." if random.random() > 0.3 else "Review required."
    
    new_leave = LeaveApplicationDB(
        employee_id=leave.employee_id,
        employee_name=employee.full_name,
        leave_type=leave.leave_type,
        start_date=start_date,
        end_date=end_date,
        reason=leave.reason,
        status="Pending",
        ai_recommendation=ai_recommendation
    )
    
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    
    return leave_db_to_pydantic(new_leave)

@app.put("/leaves/{leave_id}/status")
def update_leave_status(leave_id: int, status: str, db: Session = Depends(get_db)):
    """Update leave application status"""
    if status not in ["Pending", "Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be Pending, Approved, or Rejected")
    
    leave = db.query(LeaveApplicationDB).filter(LeaveApplicationDB.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
    
    leave.status = status
    db.commit()
    db.refresh(leave)
    
    return {"message": f"Leave status updated to {status}", "leave": leave_db_to_pydantic(leave)}

@app.post("/auth/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user (admin or employee)"""
    if credentials.role == "ADMIN":
        if credentials.email in ADMIN_EMAILS and credentials.password == ADMIN_PASSWORDS.get(credentials.email):
            return LoginResponse(
                success=True,
                role="ADMIN",
                email=credentials.email,
                message="Login successful"
            )
        else:
            return LoginResponse(
                success=False,
                message="Invalid admin credentials"
            )
    else:  # EMPLOYEE
        # Find employee by email
        employee = db.query(EmployeeDB).filter(EmployeeDB.email == credentials.email).first()
        if employee and employee.password == credentials.password:
            return LoginResponse(
                success=True,
                role="EMPLOYEE",
                email=credentials.email,
                message="Login successful"
            )
        
        return LoginResponse(
            success=False,
            message="Invalid employee credentials"
        )

@app.put("/employees/{employee_id}/status")
def update_employee_status(employee_id: int, status: str, db: Session = Depends(get_db)):
    """Update employee status (Active, On Leave, Terminated)"""
    employee = db.query(EmployeeDB).filter(EmployeeDB.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if status not in ["Active", "On Leave", "Terminated"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    employee.status = status
    db.commit()
    db.refresh(employee)
    
    return {"message": f"Employee status updated to {status}", "employee": employee_db_to_pydantic(employee)}

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    salary: Optional[int] = None
    address: Optional[str] = None

@app.put("/employees/{employee_id}")
def update_employee(employee_id: int, emp_update: EmployeeUpdate, db: Session = Depends(get_db)):
    """Update employee details"""
    employee = db.query(EmployeeDB).filter(EmployeeDB.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Update fields if provided
    if emp_update.full_name is not None:
        employee.full_name = emp_update.full_name
    if emp_update.email is not None:
        # Check if email already exists for another employee
        existing = db.query(EmployeeDB).filter(EmployeeDB.email == emp_update.email, EmployeeDB.id != employee_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
        employee.email = emp_update.email
    if emp_update.phone is not None:
        employee.phone = emp_update.phone
    if emp_update.department is not None:
        employee.department = emp_update.department
    if emp_update.designation is not None:
        employee.designation = emp_update.designation
    if emp_update.salary is not None:
        employee.salary = float(emp_update.salary)
    if emp_update.address is not None:
        employee.address = emp_update.address
    
    db.commit()
    db.refresh(employee)
    
    return employee_db_to_pydantic(employee)

@app.post("/payroll/run")
def run_payroll(db: Session = Depends(get_db)):
    """Run payroll for current month (IST)"""
    try:
        import pytz
        
        # Get IST timezone
        ist = pytz.timezone('Asia/Kolkata')
        ist_now = datetime.now(ist)
        current_month = ist_now.strftime("%B")  # e.g., "December"
        current_year = ist_now.year
        
        # Get all active employees (including those on leave)
        employees = db.query(EmployeeDB).filter(EmployeeDB.status != "Terminated").all()
        
        if not employees:
            raise HTTPException(status_code=400, detail="No active employees found. Cannot run payroll.")
        
        payroll_records = []
        employee_net_salaries = {}  # Store net salaries for notifications
        records_created_count = 0
        
        for emp in employees:
            # Check if payroll already exists for this employee for this month
            existing_record = db.query(PayrollRecordDB).filter(
                PayrollRecordDB.employee_id == emp.id,
                PayrollRecordDB.month == current_month,
                PayrollRecordDB.year == current_year
            ).first()
            
            if existing_record:
                continue # Skip if already processed
                
            # Calculate payroll components
            annual_salary = float(emp.salary or 0)
            if annual_salary <= 0:
                continue  # Skip employees with no salary
            
            monthly_basic = annual_salary / 12
            hra = monthly_basic * 0.4  # 40% HRA
            allowances = monthly_basic * 0.1  # 10% allowances
            deductions = monthly_basic * 0.15  # 15% deductions (tax, etc.)
            net_salary = monthly_basic + hra + allowances - deductions
            
            employee_net_salaries[emp.id] = net_salary
            
            payroll_record = PayrollRecordDB(
                employee_id=emp.id,
                employee_name=emp.full_name,
                month=current_month,
                year=current_year,
                basic_salary=round(monthly_basic, 2),
                hra=round(hra, 2),
                allowances=round(allowances, 2),
                deductions=round(deductions, 2),
                net_salary=round(net_salary, 2),
                status="Processing",
                released="No"
            )
            db.add(payroll_record)
            payroll_records.append(payroll_record)
            records_created_count += 1
            payroll_records.append(payroll_record)
    
        
        # Create notifications for all employees
        # Use UTC datetime for notifications (consistent with database default)
        notification_time = datetime.utcnow()
        
        for emp in employees:
            if emp.id in employee_net_salaries:  # Only notify employees with payroll records
                net_sal = employee_net_salaries.get(emp.id, 0)
                notification = NotificationDB(
                    user_id=emp.id,
                    user_type="EMPLOYEE",
                    title="Payroll Processed",
                    message=f"Your payroll for {current_month} {current_year} has been processed. Net salary: Rs. {net_sal:,.2f}",
                    type="success",
                    read="No",
                    created_at=notification_time
                )
                db.add(notification)
        
        # Create notification for admin (use user_id=0 for admin)
        if payroll_records:
            admin_notification = NotificationDB(
                user_id=0,
                user_type="ADMIN",
                title="Payroll Processed",
                message=f"Payroll processed for {current_month} {current_year}. {len(payroll_records)} records created.",
                type="success",
                read="No",
                created_at=notification_time
            )
            db.add(admin_notification)
        
        db.commit()
        
        return {
            "message": f"Payroll processed for {current_month} {current_year}",
            "records_created": len(payroll_records),
            "month": current_month,
            "year": current_year
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error in run_payroll: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error processing payroll: {str(e)}")

@app.get("/payroll/")
def get_payroll_records(employee_id: Optional[int] = None, released_only: Optional[bool] = None, db: Session = Depends(get_db)):
    """Get payroll records (all or for specific employee)"""
    query = db.query(PayrollRecordDB)
    
    if employee_id:
        query = query.filter(PayrollRecordDB.employee_id == employee_id)
        # For employees, only show released payslips
        if released_only is None:
            released_only = True
        if released_only:
            query = query.filter(PayrollRecordDB.released == "Yes")
    else:
        # For admin, show all records
        if released_only is not None and released_only:
            query = query.filter(PayrollRecordDB.released == "Yes")
    
    records = query.order_by(PayrollRecordDB.year.desc(), PayrollRecordDB.month.desc()).all()
    
    result = []
    for record in records:
        result.append({
            "id": record.id,
            "employee_id": record.employee_id,
            "employee_name": record.employee_name,
            "month": record.month,
            "year": record.year,
            "basic_salary": record.basic_salary,
            "hra": record.hra,
            "allowances": record.allowances,
            "deductions": record.deductions,
            "net_salary": record.net_salary,
            "payment_date": record.payment_date.strftime("%Y-%m-%d") if record.payment_date else None,
            "status": record.status,
            "released": record.released
        })
    
    return result

@app.put("/payroll/{payroll_id}/release")
def release_payroll_slip(payroll_id: int, db: Session = Depends(get_db)):
    """Release payroll slip to employee"""
    record = db.query(PayrollRecordDB).filter(PayrollRecordDB.id == payroll_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    try:
        record.released = "Yes"
        record.status = "Paid"
        if not record.payment_date:
            from datetime import date
            record.payment_date = date.today()
        
        # Create notification for the employee
        notification_time = datetime.utcnow()
        notification = NotificationDB(
            user_id=record.employee_id,
            user_type="EMPLOYEE",
            title="Payslip Released",
            message=f"Your payslip for {record.month} {record.year} has been released. Net salary: Rs. {record.net_salary:,.2f}",
            type="success",
            read="No",
            created_at=notification_time
        )
        db.add(notification)
        db.commit()
        print(f"Payroll slip {payroll_id} released for employee {record.employee_id}")
        return {"message": "Payroll slip released to employee"}
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error releasing payroll slip: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error releasing payroll slip: {str(e)}")

@app.get("/notifications/")
def get_notifications(user_id: Optional[int] = None, user_type: Optional[str] = None, db: Session = Depends(get_db)):
    """Get notifications for user"""
    try:
        query = db.query(NotificationDB)
        
        # For admin, show notifications with user_id=0 or user_type=ADMIN
        if user_type == "ADMIN":
            # Admin can see all ADMIN type notifications or notifications with user_id=0
            query = query.filter(
                (NotificationDB.user_type == "ADMIN") | (NotificationDB.user_id == 0)
            )
        elif user_id:
            # For employees, show only their notifications
            query = query.filter(NotificationDB.user_id == user_id)
            if user_type:
                query = query.filter(NotificationDB.user_type == user_type)
        elif user_type:
            query = query.filter(NotificationDB.user_type == user_type)
        
        notifications = query.order_by(NotificationDB.created_at.desc()).limit(50).all()
        
        result = []
        for notif in notifications:
            # Convert datetime to string
            try:
                if hasattr(notif.created_at, 'strftime'):
                    timestamp_str = notif.created_at.strftime("%Y-%m-%d %H:%M:%S")
                else:
                    timestamp_str = str(notif.created_at)
            except Exception:
                timestamp_str = str(notif.created_at)
            
            result.append({
                "id": notif.id,
                "title": notif.title,
                "body": notif.message,
                "read": notif.read == "Yes",
                "createdAt": timestamp_str
            })
        
        return result
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error in get_notifications: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@app.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark notification as read"""
    notif = db.query(NotificationDB).filter(NotificationDB.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.read = "Yes"
    db.commit()
    return {"message": "Notification marked as read"}

class ReviewCycleRequest(BaseModel):
    cycle: str  # Q1, Q2, Q3, Q4, Annual

@app.post("/performance/start-review-cycle")
def start_review_cycle(request: ReviewCycleRequest, db: Session = Depends(get_db)):
    """Start a performance review cycle"""
    # Get all active employees
    employees = db.query(EmployeeDB).filter(EmployeeDB.status == "Active").all()
    
    notification_time = datetime.utcnow()
    from datetime import timedelta
    deadline_date = notification_time.replace(day=min(notification_time.day, 28))  # Set deadline to 30 days from now
    deadline = deadline_date + timedelta(days=30)
    
    # Create notifications for all employees
    notifications_created = 0
    for emp in employees:
        notification = NotificationDB(
            user_id=emp.id,
            user_type="EMPLOYEE",
            title=f"Performance Review Cycle - {request.cycle}",
            message=f"The {request.cycle} performance review cycle has started. Please complete your self-appraisal by {deadline.strftime('%B %d, %Y')}.",
            type="info",
            read="No",
            created_at=notification_time
        )
        db.add(notification)
        notifications_created += 1
    
    # Create notification for admin
    admin_notification = NotificationDB(
        user_id=0,
        user_type="ADMIN",
        title=f"Review Cycle Started - {request.cycle}",
        message=f"Performance review cycle {request.cycle} has been initiated. {notifications_created} employees notified.",
        type="success",
        read="No",
        created_at=notification_time
    )
    db.add(admin_notification)
    
    db.commit()
    
    return {
        "message": f"Review cycle {request.cycle} started successfully",
        "employees_notified": notifications_created,
        "deadline": deadline.strftime("%Y-%m-%d")
    }

class SendNotificationRequest(BaseModel):
    employee_ids: Optional[List[int]] = None  # If None, send to all employees
    department: Optional[str] = None  # Filter by department
    title: str
    message: str
    type: str = "info"  # info, success, warning, error

@app.post("/notifications/send")
def send_notification(request: SendNotificationRequest, db: Session = Depends(get_db)):
    """Send notifications to employees"""
    try:
        notification_time = datetime.utcnow()
        notifications_created = 0
        
        # Determine which employees to notify
        if request.employee_ids:
            # Send to specific employees
            employees = db.query(EmployeeDB).filter(EmployeeDB.id.in_(request.employee_ids)).all()
        elif request.department:
            # Send to all employees in a department
            employees = db.query(EmployeeDB).filter(
                EmployeeDB.department == request.department,
                EmployeeDB.status == "Active"
            ).all()
        else:
            # Send to all active employees
            employees = db.query(EmployeeDB).filter(EmployeeDB.status == "Active").all()
        
        # Create notifications
        for emp in employees:
            notification = NotificationDB(
                user_id=emp.id,
                user_type="EMPLOYEE",
                title=request.title,
                message=request.message,
                type=request.type,
                read="No",
                created_at=notification_time
            )
            db.add(notification)
            notifications_created += 1
        
        db.commit()
        
        return {
            "message": f"Notifications sent successfully",
            "notifications_created": notifications_created,
            "employees_notified": notifications_created
        }
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error in send_notification: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error sending notifications: {str(e)}")

# Task Management Endpoints
class TaskCreate(BaseModel):
    employee_id: int
    title: str
    description: Optional[str] = None
    priority: str = "Medium"
    due_date: Optional[date] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None

@app.post("/tasks/")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task for an employee"""
    try:
        # Get employee details
        employee = db.query(EmployeeDB).filter(EmployeeDB.id == task.employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Create task
        new_task = TaskDB(
            employee_id=task.employee_id,
            employee_name=employee.full_name,
            title=task.title,
            description=task.description,
            priority=task.priority,
            due_date=task.due_date,
            created_by=1  # Admin user_id
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        
        # Create notification for employee
        notification_time = datetime.utcnow()
        notification = NotificationDB(
            user_id=task.employee_id,
            user_type="EMPLOYEE",
            title="New Task Assigned",
            message=f"You have been assigned a new task: {task.title}",
            type="info",
            read="No",
            created_at=notification_time
        )
        db.add(notification)
        db.commit()
        
        return {
            "id": new_task.id,
            "employee_id": new_task.employee_id,
            "employee_name": new_task.employee_name,
            "title": new_task.title,
            "description": new_task.description,
            "status": new_task.status,
            "priority": new_task.priority,
            "due_date": new_task.due_date.strftime("%Y-%m-%d") if new_task.due_date else None,
            "created_at": new_task.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "created_by": new_task.created_by
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error creating task: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

@app.get("/tasks/")
def get_tasks(employee_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get tasks (all for admin, or for specific employee)"""
    try:
        query = db.query(TaskDB)
        
        if employee_id:
            query = query.filter(TaskDB.employee_id == employee_id)
        
        tasks = query.order_by(TaskDB.created_at.desc()).all()
        
        result = []
        for task in tasks:
            result.append({
                "id": task.id,
                "employee_id": task.employee_id,
                "employee_name": task.employee_name,
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date.strftime("%Y-%m-%d") if task.due_date else None,
                "created_at": task.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "created_by": task.created_by
            })
        
        return result
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error fetching tasks: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error fetching tasks: {str(e)}")

@app.put("/tasks/{task_id}")
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task"""
    try:
        task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task_update.title is not None:
            task.title = task_update.title
        if task_update.description is not None:
            task.description = task_update.description
        if task_update.status is not None:
            task.status = task_update.status
        if task_update.priority is not None:
            task.priority = task_update.priority
        if task_update.due_date is not None:
            task.due_date = task_update.due_date
        
        db.commit()
        db.refresh(task)
        
        return {
            "id": task.id,
            "employee_id": task.employee_id,
            "employee_name": task.employee_name,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date.strftime("%Y-%m-%d") if task.due_date else None,
            "created_at": task.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "created_by": task.created_by
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error updating task: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task"""
    try:
        task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        db.delete(task)
        db.commit()
        
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error deleting task: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")

@app.get("/ai/suggestions")
def get_ai_suggestions(db: Session = Depends(get_db)):
    """Get AI-powered suggestions for the dashboard"""
    # In a real implementation, this would run ML models or complex queries
    # For now, we'll return dynamic data based on DB state to prove connectivity
    
    suggestions = []
    
    # Check for high attrition risk
    risk_count = db.query(EmployeeDB).filter(EmployeeDB.attrition_risk == "High").count()
    if risk_count > 0:
        suggestions.append({
            "id": 1, 
            "type": "attrition", 
            "title": "Attrition Alert", 
            "message": f"{risk_count} employees show high risk of attrition based on salary and tenure analysis.", 
            "action": "Review Salaries"
        })
    else:
        # Demo Mode: Show even if 0
        suggestions.append({
            "id": 1, 
            "type": "attrition", 
            "title": "Attrition Alert (Demo)", 
            "message": "3 Senior Developers in Engineering show high risk patterns (Demo Data).", 
            "action": "Review Salaries"
        })
    
    # Check for high performance (Productivity Spike)
    # Mock logic: if we have reviews > 90
    high_performers = db.query(EmployeeDB).filter(EmployeeDB.performance_score >= 90).count()
    if high_performers > 0:
        suggestions.append({
            "id": 2, 
            "type": "productivity", 
            "title": "Productivity Spike", 
            "message": f"{high_performers} employees have exceeded performance expectations this quarter.", 
            "action": "Send Appreciation"
        })
    else:
         # Demo Mode: Show even if 0
         suggestions.append({
            "id": 2, 
            "type": "productivity", 
            "title": "Productivity Spike (Demo)", 
            "message": "Sales team exceeded Q3 targets by 15% (Demo Data).", 
            "action": "Send Appreciation"
        })
        
    # Check for pending leaves
    pending_leaves = db.query(LeaveApplicationDB).filter(LeaveApplicationDB.status == "Pending").count()
    if pending_leaves > 0:
        suggestions.append({
            "id": 3,
            "type": "pending_action", # Mapping to blue in frontend
            "title": "Pending Approvals",
            "message": f"You have {pending_leaves} leave applications waiting for approval.",
            "action": None
        })

    return suggestions

@app.post("/admin/recalculate-attrition")
def recalculate_attrition_risk(db: Session = Depends(get_db)):
    """Recalculate attrition risk for all employees"""
    try:
        employees = db.query(EmployeeDB).all()
        updated_count = 0
        high_risk_count = 0
        
        for emp in employees:
            # Calculate attrition risk based on performance score
            # More sophisticated logic: consider salary, tenure, performance
            performance_score = emp.performance_score if emp.performance_score else random.randint(70, 95)
            
            # Update performance score if it was None
            if not emp.performance_score:
                emp.performance_score = performance_score
            
            # Calculate attrition risk
            # High risk: low performance OR (low salary for senior roles)
            if performance_score < 75:
                attrition_risk = "High"
            elif performance_score < 85:
                attrition_risk = "Medium"
            else:
                attrition_risk = "Low"
            
            # Additional logic: Senior roles with lower salaries are high risk
            if emp.designation and 'senior' in emp.designation.lower():
                # Higher threshold (18L) to catch regular senior devs for demo
                if emp.department == 'Engineering' and emp.salary and emp.salary < 1800000:
                    attrition_risk = "High"
                # Sales threshold 12L
                elif emp.department == 'Sales' and emp.salary and emp.salary < 1200000:
                    attrition_risk = "High"
            
            # Update if changed
            if emp.attrition_risk != attrition_risk:
                emp.attrition_risk = attrition_risk
                updated_count += 1
                if attrition_risk == "High":
                    high_risk_count += 1
        
        db.commit()
        
        return {
            "message": "Attrition risk recalculated successfully",
            "total_employees": len(employees),
            "updated_count": updated_count,
            "high_risk_employees": high_risk_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error recalculating attrition risk: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
