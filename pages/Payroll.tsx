import React, { useEffect, useState } from 'react';
import { User, UserRole, PayrollRecord } from '../types';
import { Download, FileText, Play, CheckCircle } from 'lucide-react';
import { ApiService } from '../services/api';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface PayrollProps {
  user?: User;
}

interface PayrollRecordExtended extends PayrollRecord {
  released?: string;
}

const Payroll: React.FC<PayrollProps> = ({ user }) => {
  const isAdmin = user?.role === UserRole.ADMIN;
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecordExtended[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRunPayrollModal, setShowRunPayrollModal] = useState(false);

  const { containerRef: payrollRef } = useKeyboardNavigation({
    itemSelector: '[data-nav-item]',
    axis: 'vertical'
  });

  useEffect(() => {
    loadPayrollRecords();
  }, [user]);

  const loadPayrollRecords = async () => {
    try {
      const employeeId = isAdmin ? undefined : user?.id;
      // User request: "payslips are alos visible in payroll for employees"
      // Changing releasedOnly to false so employees can see all their generated slips.
      const releasedOnly = false;
      console.log('Loading payroll records:', { employeeId, releasedOnly, isAdmin });
      const records = await ApiService.getPayrollRecords(employeeId, releasedOnly);
      console.log('Payroll records loaded:', records);
      setPayrollRecords(records);
    } catch (error) {
      console.error('Error loading payroll records:', error);
      setPayrollRecords([]);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(now.getTime() + istOffset);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      month: months[istDate.getMonth()],
      year: istDate.getFullYear()
    };
  };

  const handleRunPayroll = async () => {
    setIsLoading(true);
    try {
      const result = await ApiService.runPayroll();
      alert(`Payroll processed successfully for ${result.month} ${result.year}! ${result.records_created} records created.`);
      setShowRunPayrollModal(false);
      loadPayrollRecords();
    } catch (error: any) {
      alert(error.message || 'Failed to run payroll');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSlip = (record: PayrollRecordExtended) => {
    // Generate PDF content (simplified - in production, use a PDF library)
    const content = `
========================================
         PAYSLIP
========================================
Month: ${record.month} ${record.year}
Employee ID: ${record.employee_id}
Employee Name: ${record.employee_name || 'N/A'}
========================================

EARNINGS:
---------
Basic Salary:     ${formatCurrency(record.basic_salary)}
HRA:              ${formatCurrency(record.hra)}
Allowances:       ${formatCurrency(record.allowances)}
----------------------------------------
Gross Salary:     ${formatCurrency(record.basic_salary + record.hra + record.allowances)}

DEDUCTIONS:
-----------
Deductions:      ${formatCurrency(record.deductions)}
----------------------------------------

NET SALARY:       ${formatCurrency(record.net_salary)}
Status:           ${record.status}
Payment Date:     ${record.payment_date || 'Pending'}

========================================
Generated on: ${new Date().toLocaleDateString('en-IN')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const employeeName = record.employee_name ? record.employee_name.replace(/\s+/g, '_') : `Employee_${record.employee_id}`;
    a.download = `payslip_${employeeName}_${record.month}_${record.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReleaseSlip = async (recordId: number) => {
    if (window.confirm('Release this payslip to the employee? They will be able to view and download it.')) {
      try {
        await ApiService.releasePayrollSlip(recordId);
        alert('Payslip released successfully! The employee will be notified and can now view it in their "My Payslips" section.');
        loadPayrollRecords();
      } catch (error) {
        alert('Failed to release payslip. Please try again.');
      }
    }
  };

  const currentMonthYear = getCurrentMonthYear();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{isAdmin ? 'Payroll Management' : 'My Salary Slips'}</h2>
          <p className="text-slate-500">{isAdmin ? 'Process and manage employee salaries' : 'View and download your monthly salary statements'}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowRunPayrollModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center"
          >
            <Play size={18} className="mr-2" />
            Run Payroll for {currentMonthYear.month}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                {isAdmin ? 'Employee' : 'Month'}
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Basic</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">HRA/Allowances</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Deductions</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Net Salary</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              {isAdmin && (
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Released</th>
              )}
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap min-w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody ref={payrollRef} className="divide-y divide-slate-100">
            {payrollRecords.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-slate-500">
                  {isAdmin ? 'No payroll records found. Run payroll to generate records.' : 'No payslips available yet.'}
                </td>
              </tr>
            ) : (
              payrollRecords.map((record) => (
                <tr
                  key={record.id}
                  data-nav-item
                  tabIndex={0}
                  className="hover:bg-slate-50 outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {isAdmin ? record.employee_name || `Employee ${record.employee_id}` : `${record.month} ${record.year}`}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{formatCurrency(record.basic_salary)}</td>
                  <td className="px-6 py-4 text-slate-600">{formatCurrency(record.hra + record.allowances)}</td>
                  <td className="px-6 py-4 text-red-500">{formatCurrency(record.deductions)}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(record.net_salary)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${record.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {record.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      {record.released === 'Yes' ? (
                        <span className="text-emerald-600 flex items-center">
                          <CheckCircle size={16} className="mr-1" />
                          Released
                        </span>
                      ) : (
                        <span className="text-slate-400">Not Released</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex space-x-1 lg:space-x-2 whitespace-nowrap min-w-[140px]">
                      {/* User request: Payslips visible/downloadable even if not released */}
                      {(isAdmin || true) && (
                        <button
                          onClick={() => handleDownloadSlip(record)}
                          className="text-blue-600 text-xs lg:text-sm hover:underline flex items-center p-1 rounded hover:bg-blue-50"
                          title="Download Slip"
                        >
                          <Download size={16} className="lg:mr-1" /> <span className="hidden lg:inline">Slip</span>
                        </button>
                      )}
                      {isAdmin && record.released !== 'Yes' && (
                        <button
                          onClick={() => handleReleaseSlip(record.id)}
                          className="text-emerald-600 text-xs lg:text-sm hover:underline flex items-center p-1 rounded hover:bg-emerald-50"
                          title="Release Payslip"
                        >
                          <CheckCircle size={16} className="lg:mr-1" /> <span className="hidden lg:inline">Release</span>
                        </button>
                      )}
                      {(isAdmin || true) && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this payroll record?')) {
                              try {
                                await ApiService.deletePayrollRecord(record.id);
                                loadPayrollRecords();
                              } catch (e) {
                                alert('Failed to delete payroll record');
                              }
                            }
                          }}
                          className="text-red-600 text-xs lg:text-sm hover:underline flex items-center p-1 rounded hover:bg-red-50"
                          title="Delete Record"
                        >
                          <FileText size={16} className="lg:mr-1" /> <span className="hidden lg:inline">Delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Run Payroll Modal */}
      {showRunPayrollModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Run Payroll</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4">
                This will process payroll for <strong>{currentMonthYear.month} {currentMonthYear.year}</strong> for all active employees.
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 mb-2">
                  Payroll will be calculated based on:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-blue-800">
                  <li>Basic Salary: Annual salary / 12</li>
                  <li>HRA: 40% of basic salary</li>
                  <li>Allowances: 10% of basic salary</li>
                  <li>Deductions: 15% of basic salary</li>
                </ul>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRunPayrollModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRunPayroll}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Run Payroll'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
