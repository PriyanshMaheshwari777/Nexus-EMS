import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Calendar, DollarSign,
  LogOut, Bell, Menu, X, ChevronDown, User as UserIcon,
  PieChart, Settings, FileText, CheckSquare, CreditCard, Briefcase
} from 'lucide-react';
import { UserRole, User, Notification } from '../types';
import { ApiService } from '../services/api';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = async () => {
    try {
      const userType = user.role === UserRole.ADMIN ? 'ADMIN' : 'EMPLOYEE';
      console.log('Loading notifications:', { userId: user.id, userType });
      const data = await ApiService.getNotifications(user.id, userType);
      console.log('Notifications loaded:', data);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await ApiService.markNotificationRead(notif.id);
      loadNotifications();
    }
    setShowNotifications(false); // Close dropdown

    // Smart Navigation: Go to relevant page based on title/content
    // Smart Navigation: Go to relevant page based on title/content
    // @ts-ignore - message exists on backend response
    const textStr = (notif.title + " " + (notif.body || notif.message || '')).toLowerCase();

    if (textStr.includes('task')) {
      let searchTerm = '';
      // @ts-ignore
      const msg = (notif.body || notif.message || '');
      if (msg.includes('task:')) {
        searchTerm = msg.split('task:')[1].trim();
      } else {
        searchTerm = notif.title.replace('New Task', '').trim();
      }
      searchTerm = searchTerm.replace(/[.]*$/, '');

      (onNavigate as any)('tasks', { search: searchTerm });
    } else if (textStr.includes('leave') || textStr.includes('approval')) {
      onNavigate('leaves');
    } else if (textStr.includes('payroll') || textStr.includes('payslip') || textStr.includes('salary')) {
      onNavigate('payroll');
    } else if (textStr.includes('performance') || textStr.includes('appreciation')) {
      onNavigate('dashboard');
    } else {
      onNavigate('notifications'); // Default to full list
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    // Ensure timestamp is treated as UTC if it doesn't have an offset
    const timeStr = timestamp.endsWith('Z') || timestamp.includes('+') ? timestamp : timestamp + 'Z';
    const time = new Date(timeStr);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return time.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const { containerRef: sidebarRef } = useKeyboardNavigation({
    itemSelector: 'button',
    enabled: !isMobileMenuOpen,
    allowBodyFocus: true
  });

  const { containerRef: headerRef } = useKeyboardNavigation({
    itemSelector: '[data-header-nav]',
    axis: 'horizontal'
  });

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { containerRef: userMenuRef } = useKeyboardNavigation({
    itemSelector: 'button',
    enabled: isUserMenuOpen
  });

  const { containerRef: notificationsRef } = useKeyboardNavigation({
    itemSelector: '[data-notif-item]',
    enabled: showNotifications,
    axis: 'vertical'
  });

  // Auto-focus first item when menus open
  useEffect(() => {
    if (isUserMenuOpen && userMenuRef.current) {
      const firstBtn = userMenuRef.current.querySelector('button') as HTMLElement;
      if (firstBtn) setTimeout(() => firstBtn.focus(), 50);
    }
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (showNotifications && notificationsRef.current) {
      // Find first item
      const firstItem = notificationsRef.current.querySelector('[data-notif-item]') as HTMLElement;
      if (firstItem) setTimeout(() => firstItem.focus(), 50);
    }
  }, [showNotifications]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ... (sidebar code remains same) ... */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
      `}>
        {/* ... */}
        <div ref={sidebarRef} className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="font-bold text-xl">N</span>
              </div>
              <span className="font-bold text-xl tracking-tight">Nexus EMS</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {/* ... Sidebar Items ... */}
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={currentPage === 'dashboard'}
              onClick={() => onNavigate('dashboard')}
            />

            {user.role === UserRole.ADMIN && (
              <SidebarItem
                icon={Users}
                label="Employees"
                active={currentPage === 'employees'}
                onClick={() => onNavigate('employees')}
              />
            )}

            <SidebarItem
              icon={Calendar}
              label={user.role === UserRole.ADMIN ? "Leave Mgmt" : "My Leaves"}
              active={currentPage === 'leaves'}
              onClick={() => onNavigate('leaves')}
            />

            {user.role === UserRole.ADMIN ? (
              <SidebarItem
                icon={CreditCard}
                label="Payroll"
                active={currentPage === 'payroll'}
                onClick={() => onNavigate('payroll')}
              />
            ) : (
              <SidebarItem
                icon={CreditCard}
                label="My Payslips"
                active={currentPage === 'payroll'}
                onClick={() => onNavigate('payroll')}
              />
            )}

            {user.role === UserRole.ADMIN && (
              <SidebarItem
                icon={PieChart}
                label="Performance"
                active={currentPage === 'performance'}
                onClick={() => onNavigate('performance')}
              />
            )}

            <SidebarItem
              icon={Calendar}
              label="Calendar"
              active={currentPage === 'calendar'}
              onClick={() => onNavigate('calendar')}
            />

            <SidebarItem
              icon={CheckSquare}
              label={user.role === UserRole.ADMIN ? "Tasks" : "My Tasks"}
              active={currentPage === 'tasks'}
              onClick={() => onNavigate('tasks')}
            />

            <SidebarItem
              icon={FileText}
              label="Documents"
              active={currentPage === 'documents'}
              onClick={() => onNavigate('documents')}
            />

            {user.role === UserRole.ADMIN && (
              <SidebarItem
                icon={Briefcase}
                label="Recruitment"
                active={currentPage === 'recruitment'}
                onClick={() => onNavigate('recruitment')}
              />
            )}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-slate-500 hover:text-slate-700"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center space-x-2 md:space-x-4 ml-auto">
            {/* Header Navigation Container */}
            <div ref={headerRef} className="flex items-center space-x-4">

              {/* Notification Bell */}
              <div className="relative">
                <button
                  data-header-nav
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                {showNotifications && (
                  // ... Notification Dropdown content (kept as is mostly, just ensuring context) ...
                  <div ref={notificationsRef} className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 font-semibold text-sm text-slate-700 flex justify-between items-center">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto outline-none">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            data-notif-item
                            tabIndex={0}
                            onClick={() => handleNotificationClick(n)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleNotificationClick(n);
                            }}
                            className={`p-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500 ${!n.read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-slate-800">{n.title}</h4>
                                {/* @ts-ignore */}
                                <p className="text-xs text-slate-500 mt-1">{n.body || n.message}</p>
                                <span className="text-[10px] text-slate-400 mt-2 block">{formatTimeAgo(n.createdAt)}</span>
                              </div>
                              {!n.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div
                        data-notif-item
                        tabIndex={0}
                        onClick={() => {
                          setShowNotifications(false);
                          onNavigate('notifications');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setShowNotifications(false);
                            onNavigate('notifications');
                          }
                        }}
                        className="p-2 text-center text-xs text-blue-600 font-medium cursor-pointer hover:bg-slate-50 outline-none focus:bg-slate-100 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                      >
                        View All
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-8 w-px bg-slate-200 mx-2"></div>

              <div className="relative">
                <div
                  data-header-nav
                  tabIndex={0}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsUserMenuOpen(!isUserMenuOpen);
                    }
                  }}
                  className="flex items-center space-x-3 cursor-pointer group p-1 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  role="button"
                >

                  <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                    <UserIcon size={20} />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.role}</p>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </div>

                {isUserMenuOpen && (
                  <div
                    ref={userMenuRef}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <div className="p-2 space-y-1">
                      {user.role === UserRole.ADMIN && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate('employees');
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
                        >
                          <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                            <Users size={16} />
                          </div>
                          <span>Add Employee</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
                      >
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md">
                          <Users size={16} />
                        </div>
                        <span>Switch Account</span>
                      </button>

                      <div className="h-px bg-slate-100 my-1"></div>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );

};

export default Layout;