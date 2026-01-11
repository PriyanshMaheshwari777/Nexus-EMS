import { Employee, LeaveApplication, DashboardStats, User, Task, PayrollRecord } from '../types';

// const API_URL = "http://localhost:8000"; // Uncomment for real backend
// Since we are in a simulated environment, we will use mock data if fetch fails
// but the code structure is ready for the Python backend.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Mock Data for fallback
// Mock Data removed to enforce DB connectivity


export const ApiService = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      const res = await fetch(`${API_URL}/dashboard-stats`);
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.warn("API Error (Stats)", e);
      throw e;
    }
  },

  getAISuggestions: async () => {
    try {
      const res = await fetch(`${API_URL}/ai/suggestions`);
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.warn("API Error (AI Suggestions)", e);
      return [];
    }
  },

  getEmployees: async (): Promise<Employee[]> => {
    try {
      const res = await fetch(`${API_URL}/employees/`);
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.warn("Get Employees Error", e);
      throw e;
    }
  },

  // New method to trigger attrition risk recalculation
  recalcAttrition: async (): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/admin/recalculate-attrition`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.error("Recalc Attrition Error", e);
      throw e;
    }
  },


  createEmployee: async (emp: Omit<Employee, 'id' | 'status' | 'performance_score' | 'attrition_risk'> & { password: string }) => {
    try {
      const res = await fetch(`${API_URL}/employees/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "API Offline");
      }
      return await res.json();
    } catch (e) {
      console.log("Create Employee Error", e);
      throw e;
    }
  },

  deleteEmployee: async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Mock Delete Employee");
    }
  },

  getEmployeeByEmail: async (email: string): Promise<Employee> => {
    try {
      const res = await fetch(`${API_URL}/employees/by-email/${email}`);
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Mock Get Employee By Email");
      throw e;
    }
  },

  getLeaves: async (): Promise<LeaveApplication[]> => {
    try {
      const res = await fetch(`${API_URL}/leaves/`);
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.warn("API Error (Leaves)", e);
      return [];
    }
  },

  updateLeaveStatus: async (id: number, status: string) => {
    try {
      await fetch(`${API_URL}/leaves/${id}/status?status=${status}`, { method: 'PUT' });
    } catch (e) {
      console.log("Mock Update Leave");
    }
  },

  createLeave: async (leave: { employee_id: number; leave_type: string; start_date: string; end_date: string; reason: string }) => {
    try {
      const res = await fetch(`${API_URL}/leaves/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leave),
      });
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Create Leave Error", e);
      throw e;
    }
  },

  login: async (email: string, password: string, role: 'ADMIN' | 'EMPLOYEE') => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Login Error", e);
      return { success: false, message: "Login failed (Network Error)" };
    }
  },

  signup: async (data: any) => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        // Normalize FastAPI error response
        return { success: false, message: json.detail || "Signup failed" };
      }
      return json;
    } catch (e) {
      return { success: false, message: "Signup failed (Network Error)" };
    }
  },

  recoverPassword: async (email: string) => {
    // Mock API call
    console.log(`Recovering password for: ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      message: 'Password reset link sent to your email.',
      // SIMULATION ONLY: Returning credentials so user can actually login
      mockDebug: 'SIMULATION: Since this is a demo, use password "admin" (for admin@nexus.com) or "123456" (for others).'
    };
  },

  recoverEmail: async (phone: string) => {
    // Mock API call
    console.log(`Recovering email for phone: ${phone}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Demo: Allow strict numbers OR any valid looking 10 digit number for better UX
    if (phone === '8871647576' || phone === '7999674290' || phone.length >= 10) {
      const last4 = phone.slice(-4);
      const email = phone === '8871647576' ? 'admin@nexus.com' : `employee_${last4}@nexus.com`;

      return {
        success: true,
        email: email,
        message: 'Email found and sent to your phone via SMS.',
        // SIMULATION:
        mockDebug: `SMS: "Your Nexus EMS registered email is: ${email}"`
      };
    }
    return { success: false, message: 'No account found with this phone number.' };
  },

  recoverPasswordByPhone: async (phone: string) => {
    // Mock API call for SMS
    console.log(`Sending password via SMS to: ${phone}`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (phone.length >= 10) {
      // Dynamic Mock: Use last 4 digits to create a unique-looking email
      const last4 = phone.slice(-4);
      const email = phone === '8871647576' ? 'admin@nexus.com' : `employee_${last4}@nexus.com`;
      const password = phone === '8871647576' ? 'admin' : 'nexus123';

      return {
        success: true,
        message: `Login details sent via SMS to ${phone}.`,
        // SIMULATION:
        mockDebug: `SMS: "Nexus EMS Credentials:\nEmail: ${email}\nPassword: ${password}"`
      };
    }
    return { success: false, message: 'Invalid phone number.' };
  },

  generateNewEmail: async (details: any) => {
    // Mock API call to generate/provision email
    console.log('Generating new email with details:', details);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, email: `${details.firstName.toLowerCase()}.${details.lastName.toLowerCase()}@nexus.com`, message: 'New email generated and sent to HR.' };
  },

  updateEmployeeStatus: async (id: number, status: string) => {
    try {
      const res = await fetch(`${API_URL}/employees/${id}/status?status=${status}`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Mock Update Employee Status");
    }
  },

  deleteTerminatedEmployees: async (): Promise<{ message: string, count: number }> => {
    try {
      const res = await fetch(`${API_URL}/employees/cleanup/terminated`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "API Offline");
      }
      return await res.json();
    } catch (e) {
      console.error("Delete Terminated Employees Error", e);
      // Fallback for mock mode
      return { message: "Mock: Terminated employees cleaned up.", count: 0 };
    }
  },

  deleteRejectedLeaves: async (): Promise<{ message: string, count: number }> => {
    try {
      const res = await fetch(`${API_URL}/leaves/cleanup/rejected`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "API Offline");
      }
      return await res.json();
    } catch (e) {
      console.error("Delete Rejected Leaves Error", e);
      return { message: "Mock: Rejected leaves cleaned up.", count: 0 };
    }
  },

  updateEmployee: async (id: number, emp: Partial<Employee>) => {
    try {
      const res = await fetch(`${API_URL}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp),
      });
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Mock Update Employee");
      throw e;
    }
  },

  runPayroll: async () => {
    try {
      const res = await fetch(`${API_URL}/payroll/run`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "API Offline");
      }
      return await res.json();
    } catch (e: any) {
      console.log("Run Payroll Error", e);
      throw e;
    }
  },

  getPayrollRecords: async (employeeId?: number, releasedOnly?: boolean): Promise<PayrollRecord[]> => {
    try {
      let url = `${API_URL}/payroll/`;
      const params = new URLSearchParams();
      if (employeeId) params.append('employee_id', employeeId.toString());
      if (releasedOnly !== undefined) params.append('released_only', releasedOnly.toString());
      if (params.toString()) url += '?' + params.toString();

      const res = await fetch(url);
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Get Payroll Records Error", e);
      return [];
    }
  },

  releasePayrollSlip: async (payrollId: number) => {
    try {
      const res = await fetch(`${API_URL}/payroll/${payrollId}/release`, {
        method: 'PUT',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "API Offline");
      }
      return await res.json();
    } catch (e) {
      console.log("Release Payroll Slip Error", e);
      throw e;
    }
  },

  deletePayrollRecord: async (payrollId: number) => {
    try {
      const res = await fetch(`${API_URL}/payroll/${payrollId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Mock Delete Payroll Record");
      throw e;
    }
  },

  getNotifications: async (userId?: number, userType?: string) => {
    try {
      let url = `${API_URL}/notifications/`;
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId.toString());
      if (userType) params.append('user_type', userType);
      if (params.toString()) url += '?' + params.toString();

      const res = await fetch(url);
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Get Notifications Error", e);
      return [];
    }
  },

  markNotificationRead: async (notificationId: number) => {
    try {
      const res = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Mock Mark Notification Read");
    }
  },

  startReviewCycle: async (cycle: string) => {
    try {
      const res = await fetch(`${API_URL}/performance/start-review-cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle }),
      });
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Mock Start Review Cycle");
      throw e;
    }
  },

  sendNotification: async (data: { employee_ids?: number[], department?: string, title: string, message: string, type?: string }) => {
    try {
      const res = await fetch(`${API_URL}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.log("Mock Send Notification");
      throw e;
    }
  },

  // Task Management
  getTasks: async (employeeId?: number): Promise<Task[]> => {
    try {
      let url = `${API_URL}/tasks/`;
      if (employeeId) url += `?employee_id=${employeeId}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Get Tasks Error", e);
      throw e;
      // return []; 
    }
  },

  createTask: async (task: { employee_id: number; title: string; description?: string; priority?: string; due_date?: string }) => {
    try {
      const res = await fetch(`${API_URL}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.log("Mock Create Task");
      throw e;
    }
  },

  updateTask: async (taskId: number, task: Partial<Task>) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.log("Mock Update Task");
      throw e;
    }
  },

  deleteTask: async (taskId: number) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("API Offline");
      return await res.json();
    } catch (e) {
      console.log("Mock Delete Task");
      throw e;
    }
  },

  cleanupCompletedTasks: async (): Promise<{ message: string, count: number }> => {
    try {
      const res = await fetch(`${API_URL}/tasks/cleanup/completed`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "API Offline");
      }
      return await res.json();
    } catch (e) {
      console.log("Mock Cleanup Completed Tasks");
      return { message: "Mock: Completed tasks cleaned up.", count: 0 };
    }
  }
};
