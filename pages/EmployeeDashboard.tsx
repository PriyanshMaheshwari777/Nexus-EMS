import React, { useEffect, useState } from 'react';
import { User, Notification } from '../types';
import { Calendar, TrendingUp, IndianRupee, Clock, CheckCircle } from 'lucide-react';
import { ApiService } from '../services/api';
import { Employee, LeaveApplication, PayrollRecord, Task } from '../types';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface Props {
  user: User;
}

const EmployeeDashboard: React.FC<Props> = ({ user }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaveBalance, setLeaveBalance] = useState(12);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nextPayroll, setNextPayroll] = useState<string>('');
  const [announcements, setAnnouncements] = useState<Notification[]>([]);

  const { containerRef: tasksRef } = useKeyboardNavigation({
    itemSelector: '[data-nav-item]',
    axis: 'vertical'
  });

  useEffect(() => {
    loadEmployeeData();
  }, [user]);

  const loadEmployeeData = async () => {
    try {
      // Get employee details
      const empData = await ApiService.getEmployeeByEmail(user.email);
      setEmployee(empData);

      // Get leaves
      const leavesData = await ApiService.getLeaves();
      const myLeaves = leavesData.filter(l => l.employee_id === user.id);
      setLeaves(myLeaves);

      // Get tasks
      if (empData) {
        const myTasks = await ApiService.getTasks(empData.id);
        setTasks(myTasks);
      } else {
        // Fallback if employee object not ready yet, try with user.id if it matches (often they are same in this simple app)
        const myTasks = await ApiService.getTasks(user.id);
        setTasks(myTasks);
      }

      // Calculate leave balance (simplified: 12 - used leaves)
      const usedLeaves = myLeaves.filter(l => l.status === 'Approved').length;
      setLeaveBalance(Math.max(0, 12 - usedLeaves));

      // Get payroll records
      const payrollRecords = await ApiService.getPayrollRecords(user.id);
      if (payrollRecords.length > 0) {
        // Find next payroll date (last payroll + 1 month)
        const lastPayroll = payrollRecords[0];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const lastMonthIndex = months.indexOf(lastPayroll.month || '');
        const nextMonthIndex = (lastMonthIndex + 1) % 12;
        const nextYear = lastPayroll.year || new Date().getFullYear();
        const finalYear = lastMonthIndex === 11 ? nextYear + 1 : nextYear;
        setNextPayroll(`${months[nextMonthIndex]} ${finalYear}`);
      } else {
        // Default to current month + 1
        const now = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const nextMonthIndex = (now.getMonth() + 1) % 12;
        const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
        setNextPayroll(`${months[nextMonthIndex]} ${nextYear}`);
      }

      // Load announcements (notifications)
      const notifications = await ApiService.getNotifications(user.id, 'EMPLOYEE');
      const announcementNotifs = notifications.filter(n =>
        n.title.toLowerCase().includes('announcement') ||
        n.title.toLowerCase().includes('meeting') ||
        n.title.toLowerCase().includes('benefit') ||
        n.title.toLowerCase().includes('appreciation')
      );
      setAnnouncements(announcementNotifs.slice(0, 5)); // Show latest 5
    } catch (error) {
      console.error('Error loading employee data:', error);
    }
  };

  const getDaysUntilPayroll = () => {
    if (!nextPayroll) return 0;
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const [month, year] = nextPayroll.split(' ');
    const payrollDate = new Date(parseInt(year), months.indexOf(month), 1);
    const diffTime = payrollDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome back, {user.name}</h1>
        <p className="text-slate-500">Here is your daily overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg"><Calendar size={20} /></div>
            <h3 className="font-semibold">Leave Balance</h3>
          </div>
          <div className="text-3xl font-bold mb-1">{leaveBalance} Days</div>
          <p className="text-blue-200 text-sm">Available this year</p>
        </div>

        <div className="bg-emerald-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-emerald-500 rounded-lg"><TrendingUp size={20} /></div>
            <h3 className="font-semibold">My Performance</h3>
          </div>
          <div className="text-3xl font-bold mb-1">{employee?.performance_score || 0}%</div>
          <p className="text-emerald-200 text-sm">
            {employee?.performance_score && employee.performance_score >= 90 ? 'Excellent rating' :
              employee?.performance_score && employee.performance_score >= 80 ? 'Good rating' :
                employee?.performance_score && employee.performance_score >= 70 ? 'Average rating' : 'Needs improvement'}
          </p>
        </div>

        <div className="bg-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-500 rounded-lg"><IndianRupee size={20} /></div>
            <h3 className="font-semibold">Next Payroll</h3>
          </div>
          <div className="text-3xl font-bold mb-1">{nextPayroll ? nextPayroll.split(' ')[0] : 'N/A'}</div>
          <p className="text-purple-200 text-sm">
            {getDaysUntilPayroll() > 0 ? `Processing in ${getDaysUntilPayroll()} days` : 'Processing soon'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">




        {/* Recent Activity / Tasks */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">My Tasks</h3>
          <div ref={tasksRef} className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-sm">No tasks assigned</div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  data-nav-item
                  tabIndex={0}
                  className={`p-4 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all ${task.status === 'Completed' ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${task.status === 'Completed' ? 'bg-emerald-500' :
                      task.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'
                      }`}></div>
                    <span className="text-sm font-medium text-slate-700">{task.title}</span>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center">
                    {task.status === 'Completed' ? (
                      <><CheckCircle size={12} className="mr-1" /> Done</>
                    ) : (
                      <><Clock size={12} className="mr-1" /> {task.status}</>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements - Dynamic from Notifications */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Company Announcements</h3>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-4">
                No announcements at this time. Check back later for updates.
              </div>
            ) : (
              announcements.map((announcement, idx) => (
                <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-1">
                  <h4 className="text-sm font-bold text-slate-800">{announcement.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{announcement.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboard;
