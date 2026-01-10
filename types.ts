export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  designation?: string;
  avatarUrl?: string;
}

export interface Employee {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joining_date: string;
  salary: number;
  address?: string;
  dob?: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  performance_score?: number; // 0-100
  attrition_risk?: 'Low' | 'Medium' | 'High';
}

export interface LeaveApplication {
  id: number;
  employee_id: number;
  employee_name: string;
  leave_type: 'Sick' | 'Casual' | 'Earned' | 'Maternity';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  ai_recommendation?: string;
}

export interface PayrollRecord {
  id: number;
  employee_id: number;
  employee_name?: string;
  month: string;
  year?: number;
  basic_salary: number;
  hra: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_date: string | null;
  status: 'Paid' | 'Processing';
  released?: string;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  total_employees: number;
  on_leave_today: number;
  high_attrition_risk: number;
  avg_performance: number;
  department_dist: { name: string; value: number }[];
}

export interface Task {
  id: number;
  employee_id: number;
  employee_name: string;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  due_date?: string;
  created_at: string;
  created_by: number;
}