import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ApiService } from '../services/api';
import { DashboardStats, Employee } from '../types';
import { Download, FileText, TrendingUp, Users } from 'lucide-react';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

const Reports: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const { containerRef: reportsRef } = useKeyboardNavigation({
    itemSelector: '[data-nav-item]',
    axis: 'vertical'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [statsData, employeesData] = await Promise.all([
      ApiService.getStats(),
      ApiService.getEmployees()
    ]);
    setStats(statsData);
    setEmployees(employeesData);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    alert(`Exporting report as ${format.toUpperCase()}...\n(This would generate and download the report in a real application)`);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!stats) {
    return <div className="p-10 text-center text-slate-500">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics & Reports</h2>
          <p className="text-slate-500">Comprehensive insights into your workforce</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleExport('pdf')}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center"
          >
            <Download size={18} className="mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center"
          >
            <FileText size={18} className="mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Total Employees</span>
            <Users className="text-blue-500" size={20} />
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{stats.total_employees}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">On Leave</span>
            <Users className="text-amber-500" size={20} />
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{stats.on_leave_today}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">High Risk</span>
            <TrendingUp className="text-red-500" size={20} />
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{stats.high_attrition_risk}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Avg Performance</span>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{stats.avg_performance}%</h3>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Department Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.department_dist}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
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

        {/* Department Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Department Breakdown</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.department_dist}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.department_dist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Employee Performance Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody ref={reportsRef} className="divide-y divide-slate-100">
              {employees.slice(0, 10).map((emp) => (
                <tr
                  key={emp.id}
                  data-nav-item
                  tabIndex={0}
                  className="hover:bg-slate-50 outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{emp.full_name}</div>
                    <div className="text-sm text-slate-500">{emp.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{emp.department}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-20 bg-slate-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${emp.performance_score || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-600">{emp.performance_score || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${emp.attrition_risk === 'High' ? 'text-red-600 bg-red-50' :
                      emp.attrition_risk === 'Medium' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                      }`}>
                      {emp.attrition_risk || 'Low'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${emp.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;

