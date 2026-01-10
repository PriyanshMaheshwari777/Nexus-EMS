import React, { useState } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Performance from './pages/Performance';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Notifications from './pages/Notifications';
import Recruitment from './pages/Recruitment'; // Added import for Recruitment
import { UserRole, User } from './types';
import { ApiService } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageParams, setPageParams] = useState<any>(null);

  const handleNavigate = (page: string, params: any = null) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  const handleLogin = async (role: UserRole, email: string) => {
    if (role === UserRole.ADMIN) {
      setUser({
        id: 1,
        name: 'Administrator',
        email: email,
        role: role,
        department: 'Management',
        designation: 'System Admin'
      });
      setCurrentPage('dashboard');
    } else {
      // Fetch employee data from API
      try {
        const employee = await ApiService.getEmployeeByEmail(email);
        setUser({
          id: employee.id,
          name: employee.full_name,
          email: employee.email,
          role: role,
          department: employee.department,
          designation: employee.designation
        });
        setCurrentPage('dashboard');
      } catch (e) {
        // Fallback if API fails
        const name = email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        setUser({
          id: 2,
          name: name,
          email: email,
          role: role,
          department: 'Engineering',
          designation: 'Employee'
        });
        setCurrentPage('dashboard');
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
    setPageParams(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return user.role === UserRole.ADMIN ? <Dashboard onNavigate={handleNavigate} /> : <EmployeeDashboard user={user} />;
      case 'employees':
        return user.role === UserRole.ADMIN ? <Employees /> : <div className="p-8">Access Denied</div>;
      case 'leaves':
        return <Leaves user={user} />;
      case 'payroll':
        // Both can access, but component renders differently based on role
        return <Payroll user={user} />;
      case 'performance':
        return user.role === UserRole.ADMIN ? <Performance /> : <div className="p-8">Access Denied</div>;
      case 'documents':
        return <Documents />;
      case 'reports':
        return user.role === UserRole.ADMIN ? <Reports /> : <div className="p-8">Access Denied</div>;
      case 'calendar':
        return <Calendar />;
      case 'tasks':
        return <Tasks user={user} initialSearch={pageParams?.search} />;
      case 'notifications':
        return <Notifications user={user} onNavigate={handleNavigate} />;
      case 'recruitment':
        return user.role === UserRole.ADMIN ? <Recruitment /> : <div className="p-8">Access Denied</div>;
      default:
        return <div className="p-8">Page Under Construction</div>;
    }
  };

  return (
    <Layout
      user={user}
      onLogout={handleLogout}
      currentPage={currentPage}
      onNavigate={handleNavigate}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;