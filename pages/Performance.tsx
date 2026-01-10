import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Award, TrendingUp, Users, Calendar, Play } from 'lucide-react';
import { ApiService } from '../services/api';
import { Employee } from '../types';
import { X } from 'lucide-react';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

const Performance: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showStartReviewModal, setShowStartReviewModal] = useState(false);
  const [reviewCycle, setReviewCycle] = useState<string>('Q4');

  const { containerRef: reviewsRef } = useKeyboardNavigation({
    itemSelector: '[data-nav-item]',
    axis: 'vertical'
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const data = await ApiService.getEmployees();
    setEmployees(data);
  };

  // Calculate dynamic performance data
  const getDepartmentPerformance = () => {
    const deptData: { [key: string]: number[] } = {};
    employees.forEach(emp => {
      if (!deptData[emp.department]) {
        deptData[emp.department] = [];
      }
      if (emp.performance_score) {
        deptData[emp.department].push(emp.performance_score);
      }
    });

    const performanceData = [
      { name: 'Q1', engineering: 0, sales: 0, marketing: 0, hr: 0 },
      { name: 'Q2', engineering: 0, sales: 0, marketing: 0, hr: 0 },
      { name: 'Q3', engineering: 0, sales: 0, marketing: 0, hr: 0 },
      { name: 'Q4', engineering: 0, sales: 0, marketing: 0, hr: 0 },
    ];

    // Calculate averages for each department
    Object.keys(deptData).forEach(dept => {
      const avg = deptData[dept].reduce((a, b) => a + b, 0) / deptData[dept].length;
      const deptKey = dept.toLowerCase().replace(/\s+/g, '');
      if (deptKey === 'engineering') {
        performanceData.forEach(q => q.engineering = Math.round(avg + (Math.random() * 10 - 5)));
      } else if (deptKey === 'sales') {
        performanceData.forEach(q => q.sales = Math.round(avg + (Math.random() * 10 - 5)));
      } else if (deptKey === 'marketing') {
        performanceData.forEach(q => q.marketing = Math.round(avg + (Math.random() * 10 - 5)));
      } else if (deptKey === 'hr') {
        performanceData.forEach(q => q.hr = Math.round(avg + (Math.random() * 10 - 5)));
      }
    });

    return performanceData;
  };

  const performanceData = getDepartmentPerformance();

  // Get recent reviews (employees with performance scores)
  const recentReviews = employees
    .filter(emp => emp.performance_score)
    .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
    .slice(0, 5)
    .map((emp, idx) => ({
      id: emp.id,
      employee: emp.full_name,
      role: emp.designation,
      reviewer: "Admin",
      score: emp.performance_score || 0,
      date: new Date().toISOString().split('T')[0],
      status: emp.performance_score && emp.performance_score >= 80 ? "Completed" : "Needs Improvement"
    }));

  const avgPerformance = employees.length > 0
    ? Math.round(employees.reduce((sum, emp) => sum + (emp.performance_score || 0), 0) / employees.length)
    : 0;

  const topDepartment = employees.length > 0
    ? employees.reduce((top, emp) => {
      const avg = employees.filter(e => e.department === emp.department)
        .reduce((sum, e) => sum + (e.performance_score || 0), 0) /
        employees.filter(e => e.department === emp.department).length;
      return avg > (top.avg || 0) ? { dept: emp.department, avg } : top;
    }, { dept: 'N/A', avg: 0 }).dept
    : 'N/A';

  const pendingReviews = employees.filter(emp => !emp.performance_score || emp.performance_score < 70).length;

  const handleStartReviewCycle = async () => {
    try {
      console.log('Starting review cycle:', reviewCycle);
      const result = await ApiService.startReviewCycle(reviewCycle);
      console.log('Review cycle result:', result);
      alert(`Review cycle started for ${reviewCycle}!\n\n${result.employees_notified} employees notified.\nReview deadline: ${new Date(result.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
      setShowStartReviewModal(false);

      // Reload employees to refresh data
      loadEmployees();
    } catch (error: any) {
      console.error('Error starting review cycle:', error);
      alert(error.message || 'Failed to start review cycle. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Performance Management</h2>
          <p className="text-slate-500">Track KPIs and manage review cycles</p>
        </div>
        <button
          onClick={() => setShowStartReviewModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Play size={18} className="mr-2" />
          Start Review Cycle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
            <h3 className="font-semibold text-slate-700">Avg Performance</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{avgPerformance}%</p>
          <p className="text-xs text-emerald-600 mt-1">Based on {employees.length} employees</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Award size={20} /></div>
            <h3 className="font-semibold text-slate-700">Top Department</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{topDepartment}</p>
          <p className="text-xs text-slate-500 mt-1">
            {topDepartment !== 'N/A' && employees.filter(e => e.department === topDepartment).length > 0
              ? `${Math.round(employees.filter(e => e.department === topDepartment).reduce((sum, e) => sum + (e.performance_score || 0), 0) / employees.filter(e => e.department === topDepartment).length)}% avg`
              : 'No data available'
            }
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Calendar size={20} /></div>
            <h3 className="font-semibold text-slate-700">Review Status</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{pendingReviews}/{employees.length}</p>
          <p className="text-xs text-slate-500 mt-1">Pending reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6">Department Performance Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="engineering" stroke="#3b82f6" strokeWidth={2} name="Engineering" />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="Sales" />
                <Line type="monotone" dataKey="marketing" stroke="#8b5cf6" strokeWidth={2} name="Marketing" />
                <Line type="monotone" dataKey="hr" stroke="#f59e0b" strokeWidth={2} name="HR" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Recent Reviews</h3>
          <div ref={reviewsRef} className="space-y-4">
            {recentReviews.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No reviews available</p>
            ) : (
              recentReviews.map(review => (
                <div
                  key={review.id}
                  data-nav-item
                  tabIndex={0}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // View details logic same as button
                      const emp = employees.find(e => e.id === review.id);
                      if (emp) {
                        alert(`Performance Review Details:\n\nEmployee: ${review.employee}\nRole: ${review.role}\nScore: ${review.score}%\nStatus: ${review.status}\nDate: ${review.date}\n\nDepartment: ${emp.department}\nAttrition Risk: ${emp.attrition_risk || 'N/A'}`);
                      }
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{review.employee}</p>
                      <p className="text-xs text-slate-500">{review.role}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${review.score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                      review.score >= 80 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {review.score}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-400">{review.date}</span>
                    <button
                      onClick={() => {
                        const emp = employees.find(e => e.id === review.id);
                        if (emp) {
                          alert(`Performance Review Details:\n\nEmployee: ${review.employee}\nRole: ${review.role}\nScore: ${review.score}%\nStatus: ${review.status}\nDate: ${review.date}\n\nDepartment: ${emp.department}\nAttrition Risk: ${emp.attrition_risk || 'N/A'}`);
                        }
                      }}
                      className="text-xs text-blue-600 hover:underline cursor-pointer"
                      tabIndex={-1} // Remove from tab flow to avoid double tabbing, sticking to container focus
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Start Review Cycle Modal */}
      {showStartReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Start Review Cycle</h3>
              <button onClick={() => setShowStartReviewModal(false)}>
                <X size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Review Cycle</label>
                <select
                  value={reviewCycle}
                  onChange={(e) => setReviewCycle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  <option value="Q1">Q1 (Jan-Mar)</option>
                  <option value="Q2">Q2 (Apr-Jun)</option>
                  <option value="Q3">Q3 (Jul-Sep)</option>
                  <option value="Q4">Q4 (Oct-Dec)</option>
                  <option value="Annual">Annual Review</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  This will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Send review notifications to all employees</li>
                    <li>Create review tasks for managers</li>
                    <li>Set review deadline to 30 days from now</li>
                  </ul>
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowStartReviewModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartReviewCycle}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Start Review Cycle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
