import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserMinus, AlertTriangle, TrendingUp, ArrowUp, ArrowDown, X } from 'lucide-react';
import { ApiService } from '../services/api';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { DashboardStats, Employee } from '../types';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
    <div className="flex items-center text-xs font-medium mt-4">
      {trend === 'up' && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center"><ArrowUp size={12} className="mr-1" /> +5%</span>}
      {trend === 'down' && <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center"><ArrowDown size={12} className="mr-1" /> -2%</span>}
      <span className="text-slate-400 ml-2">{subtext}</span>
    </div>
  </div>
);

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showAppreciationModal, setShowAppreciationModal] = useState(false);
  const [highRiskEmployees, setHighRiskEmployees] = useState<Employee[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);


  const { containerRef: suggestionsRef } = useKeyboardNavigation({
    itemSelector: '[data-nav-item]',
    axis: 'vertical'
  });
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [statsData, employeesData, suggestionsData] = await Promise.all([
      ApiService.getStats(),
      ApiService.getEmployees(),
      ApiService.getAISuggestions()
    ]);
    setStats(statsData);
    setEmployees(employeesData);
    setSuggestions(suggestionsData);
    // Filter high risk employees
    let highRisk = employeesData.filter(emp => emp.attrition_risk === 'High');
    if (highRisk.length === 0) {
      // Attempt to recalculate attrition risk
      try {
        const result = await ApiService.recalcAttrition();
        console.log('Recalc attrition result:', result);
        // Refetch employees after recalculation
        const refreshedEmployees = await ApiService.getEmployees();
        highRisk = refreshedEmployees.filter(emp => emp.attrition_risk === 'High');
      } catch (e) {
        console.error('Failed to recalc attrition risk', e);
      }
    }
    setHighRiskEmployees(highRisk);
  };

  const handleViewReport = () => {
    if (onNavigate) {
      onNavigate('reports');
    } else {
      alert('Navigate to Reports page');
    }
  };

  const handleReviewSalaries = () => {
    setShowSalaryModal(true);
  };

  const handleSendAppreciation = () => {
    setShowAppreciationModal(true);
  };

  if (!stats) return <div className="p-10 text-center text-slate-500">Loading AI Insights...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome to Nexus Dashboard</h1>
          <p className="text-blue-100 max-w-xl">AI-Driven Insights for Smarter Workforce Management. Your comprehensive overview of company performance and employee well-being.</p>
        </div>
        {/* Abstract shapes */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform translate-x-12"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.total_employees}
          subtext="vs last month"
          icon={Users}
          colorClass="bg-blue-500"
          trend="up"
        />
        <StatCard
          title="On Leave Today"
          value={stats.on_leave_today}
          subtext="2 pending approvals"
          icon={UserMinus}
          colorClass="bg-amber-500"
        />
        <StatCard
          title="High Attrition Risk"
          value={stats.high_attrition_risk}
          subtext="Action needed"
          icon={AlertTriangle}
          colorClass="bg-red-500"
          trend="down"
        />
        <StatCard
          title="Avg Performance"
          value={`${stats.avg_performance}%`}
          subtext="Top: Engineering"
          icon={TrendingUp}
          colorClass="bg-emerald-500"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Department Distribution</h3>
            <button
              onClick={handleViewReport}
              className="text-sm text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors cursor-pointer"
            >
              View Report
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.department_dist}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>




        {/* Quick Actions / AI Suggestions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="bg-purple-100 text-purple-600 p-1 rounded mr-2 text-xs">AI</span>
            Smart Suggestions
          </h3>

          <div ref={suggestionsRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
            {suggestions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No new suggestions</p>
            ) : (
              suggestions.map((suggestion: any) => (
                <div
                  key={suggestion.id}
                  data-nav-item
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (suggestion.action === 'Review Salaries') handleReviewSalaries();
                      else if (suggestion.action === 'Send Appreciation') handleSendAppreciation();
                    }
                  }}
                  className={`p-4 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-50 transition-colors ${suggestion.type === 'attrition' ? 'bg-red-50 border-red-100' :
                    suggestion.type === 'productivity' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'
                    }`}
                >
                  <h5 className={`text-sm font-bold mb-1 ${suggestion.type === 'attrition' ? 'text-red-800' :
                    suggestion.type === 'productivity' ? 'text-emerald-800' : 'text-blue-800'
                    }`}>{suggestion.title}</h5>
                  <p className={`text-xs mb-2 ${suggestion.type === 'attrition' ? 'text-red-600' :
                    suggestion.type === 'productivity' ? 'text-emerald-600' : 'text-blue-600'
                    }`}>{suggestion.message}</p>
                  {suggestion.action && (
                    <button
                      tabIndex={-1} // Prevent tab stopping inside the card for cleaner cycling? Or should we allow focusing the button?
                      // Actually, if the card is focused, the user might want to press Enter to trigger the action.
                      // Let's make the card focus trigger the action via Enter, or keep the button clickable.
                      onClick={(e) => {
                        e.stopPropagation(); // If card has click handler
                        if (suggestion.action === 'Review Salaries') handleReviewSalaries();
                        else if (suggestion.action === 'Send Appreciation') handleSendAppreciation();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (suggestion.action === 'Review Salaries') handleReviewSalaries();
                          else if (suggestion.action === 'Send Appreciation') handleSendAppreciation();
                        }
                      }}
                      className={`text-xs bg-white px-3 py-1 rounded-full font-medium shadow-sm transition-colors cursor-pointer border ${suggestion.type === 'attrition' ? 'border-red-200 text-red-600 hover:bg-red-50' :
                        suggestion.type === 'productivity' ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                        }`}
                    >
                      {suggestion.action}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* Review Salaries Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-900">Review Salaries - Attrition Risk</h3>
              <button
                onClick={() => setShowSalaryModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-slate-600 mb-4">
                  {highRiskEmployees.length > 0 ? (
                    `You have identified ${highRiskEmployees.length} Senior Developer${highRiskEmployees.length > 1 ? 's' : ''} in Engineering with high attrition risk due to salary concerns.`
                  ) : (
                    'No high risk employees found. Consider recalculating attrition risk.'
                  )}
                </p>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={async () => {
                      try {
                        const result = await ApiService.recalcAttrition();
                        alert(result.message);
                        loadData();
                      } catch (e) {
                        console.error(e);
                        alert('Failed to recalculate attrition risk.');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Recalculate Attrition Risk
                  </button>
                </div>
                {highRiskEmployees.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Affected Employees:</h4>
                    <div className="space-y-2">
                      {highRiskEmployees.map(emp => (
                        <div key={emp.id} className="flex justify-between items-center p-2 bg-white rounded border border-slate-200">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{emp.full_name}</p>
                            <p className="text-xs text-slate-500">{emp.designation} • Current: ₹{emp.salary?.toLocaleString('en-IN')}</p>
                          </div>
                          <span className="text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700">High Risk</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
                  <p className="text-sm font-medium text-blue-900 mb-2">Recommended Actions:</p>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Conduct market salary analysis for Engineering roles (target: 10-15% above current)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Schedule one-on-one meetings with affected employees to discuss compensation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Review compensation structure and prepare adjustment proposals</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Consider retention bonuses or immediate salary adjustments</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Implement competitive salary bands based on market data</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-900 mb-1">Market Analysis Suggestion:</p>
                  <p className="text-xs text-amber-800">
                    Based on industry standards, Senior Developers in Engineering should earn between ₹7,00,000 - ₹9,00,000 annually.
                    Consider adjusting salaries to the 75th percentile to reduce attrition risk.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowSalaryModal(false);
                    if (onNavigate) {
                      onNavigate('employees');
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Go to Employees
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Send notifications to high risk employees
                      const employeeIds = highRiskEmployees.map(emp => emp.id);
                      console.log('Sending salary review notifications to:', employeeIds);
                      if (employeeIds.length > 0) {
                        const result = await ApiService.sendNotification({
                          employee_ids: employeeIds,
                          title: "Salary Review Initiated",
                          message: "A salary review has been initiated for your position. HR will contact you shortly to discuss compensation adjustments.",
                          type: "info"
                        });
                        console.log('Salary review notification result:', result);
                        alert(`Salary review task created! ${result.employees_notified || result.notifications_created || employeeIds.length} employees have been notified.`);
                      } else {
                        alert('No high-risk employees found to notify.');
                      }
                      setShowSalaryModal(false);
                    } catch (error: any) {
                      console.error('Error sending salary review notifications:', error);
                      alert(`Failed to send notifications: ${error.message || 'Please try again.'}`);
                    }
                  }}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  Create Review Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Appreciation Modal */}
      {showAppreciationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Send Appreciation Message</h3>
              <button
                onClick={() => setShowAppreciationModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100 mb-4">
                  <p className="text-sm font-semibold text-emerald-900 mb-1">Achievement:</p>
                  <p className="text-sm text-emerald-800">
                    The Sales team has exceeded Q3 targets by 15%. This outstanding performance demonstrates exceptional dedication and teamwork.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Recipients</label>
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                      <p className="text-sm text-slate-600">Sales Team (All Members)</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {employees.filter(e => e.department === 'Sales').length > 0
                          ? `${employees.filter(e => e.department === 'Sales').length} team members`
                          : 'All Sales department employees'
                        }
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                    <textarea
                      className="w-full border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={5}
                      placeholder="Write your appreciation message here..."
                      defaultValue="Congratulations to the Sales team for exceeding Q3 targets by 15%! Your hard work, dedication, and exceptional performance have not gone unnoticed. This achievement reflects your commitment to excellence and teamwork. Thank you for your outstanding contributions to our company's success. Keep up the excellent work!"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="send-email"
                        className="rounded"
                        defaultChecked
                      />
                      <label htmlFor="send-email" className="text-sm text-slate-600">
                        Send via email notification
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="post-announcement"
                        className="rounded"
                        defaultChecked
                      />
                      <label htmlFor="post-announcement" className="text-sm text-slate-600">
                        Post as company announcement
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="include-bonus"
                        className="rounded"
                      />
                      <label htmlFor="include-bonus" className="text-sm text-slate-600">
                        Include performance bonus notification
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowAppreciationModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const message = "Congratulations to the Sales team for exceeding Q3 targets by 15%! Your hard work, dedication, and exceptional performance have not gone unnoticed. This achievement reflects your commitment to excellence and teamwork. Thank you for your outstanding contributions to our company's success. Keep up the excellent work!";

                      console.log('Sending appreciation notification to Sales team');
                      const result = await ApiService.sendNotification({
                        department: "Sales",
                        title: "Team Appreciation - Q3 Excellence",
                        message: message,
                        type: "success"
                      });
                      console.log('Notification sent result:', result);

                      alert(`Appreciation message sent successfully to the Sales team! 🎉\n${result.employees_notified || result.notifications_created || 0} employees notified.`);
                      setShowAppreciationModal(false);
                    } catch (error: any) {
                      console.error('Error sending appreciation:', error);
                      alert(`Failed to send appreciation message: ${error.message || 'Please try again.'}`);
                    }
                  }}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
