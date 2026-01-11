from sqlalchemy import create_engine, Column, Integer, String, Float, Date, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date

import os

# Database connection string
# Fallback to SQLite if no DATABASE_URL is provided (Better for simple free hosting)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'nexus.db')}")

# Create engine
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Database Models
class EmployeeDB(Base):
    __tablename__ = "nexus_employees"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String)
    department = Column(String)
    designation = Column(String)
    salary = Column(Float)
    joining_date = Column(Date)
    status = Column(String, default="Active")
    performance_score = Column(Integer)
    attrition_risk = Column(String)
    address = Column(Text, nullable=True)
    dob = Column(Date, nullable=True)
    password = Column(String, nullable=False)  # Store password (in production, use hashed)

class LeaveApplicationDB(Base):
    __tablename__ = "nexus_leave_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False, index=True)
    employee_name = Column(String, nullable=False)
    leave_type = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, default="Pending")
    ai_recommendation = Column(Text, nullable=True)

class PayrollRecordDB(Base):
    __tablename__ = "nexus_payroll_records"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False, index=True)
    employee_name = Column(String, nullable=False)
    month = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    basic_salary = Column(Float, nullable=False)
    hra = Column(Float, default=0)
    allowances = Column(Float, default=0)
    deductions = Column(Float, default=0)
    net_salary = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=True)
    status = Column(String, default="Processing")  # Processing, Paid, Released
    released = Column(String, default="No")  # Yes, No - for admin release

class NotificationDB(Base):
    __tablename__ = "nexus_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    user_type = Column(String, nullable=False)  # ADMIN, EMPLOYEE
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")  # info, warning, success, error
    read = Column(String, default="No")  # Yes, No
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

class TaskDB(Base):
    __tablename__ = "nexus_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False, index=True)
    employee_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="Pending")  # Pending, In Progress, Completed
    priority = Column(String, default="Medium")  # Low, Medium, High
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_by = Column(Integer, nullable=False)  # Admin user_id who created the task

# Create all tables
def init_db():
    Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

