import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { LeaveApplication, User, UserRole } from '../types';
import { CheckCircle, XCircle, Clock, Plus, X } from 'lucide-react';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface LeavesProps {
  user: User;
}

const Leaves: React.FC<LeavesProps> = ({ user }) => {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    leave_type: 'Sick' as 'Sick' | 'Casual' | 'Earned' | 'Maternity',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { containerRef: leavesRef } = useKeyboardNavigation({
    itemSelector: '[data-nav-item]',
    axis: 'vertical'
  });

  useEffect(() => {
    loadLeaves();
  }, [user]);

  const loadLeaves = async () => {
    if (user.role === UserRole.ADMIN) {
      const data = await ApiService.getLeaves();
      setLeaves(data);
    } else {
      // For employee, get leaves for this employee
      const allLeaves = await ApiService.getLeaves();
      const myLeaves = allLeaves.filter(l => l.employee_id === user.id || l.employee_name.toLowerCase().includes(user.name.toLowerCase()));
      setLeaves(myLeaves);
    }
  };

  const handleAction = async (id: number, status: string) => {
    await ApiService.updateLeaveStatus(id, status);
    // Optimistic update
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: status as any } : l));
  };

  const handleViewLeave = (leave: LeaveApplication) => {
    setSelectedLeave(leave);
    setIsViewModalOpen(true);
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.start_date || !newLeave.end_date || !newLeave.reason) {
      alert('Please fill all fields');
      return;
    }

    await ApiService.createLeave({
      employee_id: user.id,
      leave_type: newLeave.leave_type,
      start_date: newLeave.start_date,
      end_date: newLeave.end_date,
      reason: newLeave.reason
    });

    setIsApplyModalOpen(false);
    setNewLeave({ leave_type: 'Sick', start_date: '', end_date: '', reason: '' });
    loadLeaves();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{user.role === UserRole.ADMIN ? 'Leave Applications' : 'My Leaves'}</h2>
          <p className="text-slate-500">{user.role === UserRole.ADMIN ? 'Manage employee time-off requests' : 'Track and apply for leaves'}</p>
        </div>
        {user.role === UserRole.EMPLOYEE && (
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus size={18} className="mr-2" /> Apply Leave
          </button>
        )}
        {user.role === UserRole.ADMIN && leaves.some(l => l.status === 'Rejected') && (
          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to PERMANENTLY delete all rejected leave applications?')) {
                try {
                  const result = await ApiService.deleteRejectedLeaves();
                  alert(result.message);
                  loadLeaves();
                } catch (e) {
                  alert('Failed to delete rejected leaves.');
                }
              }
            }}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium flex items-center hover:bg-red-200 transition-colors border border-red-200"
          >
            <XCircle size={18} className="mr-2" /> Cleanup Rejected
          </button>
        )}
      </div>

      <div ref={leavesRef} className="grid gap-4">
        {leaves.map((leave) => (
          <div
            key={leave.id}
            data-nav-item
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleViewLeave(leave);
            }}
            onClick={() => handleViewLeave(leave)}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h4 className="text-lg font-semibold text-slate-900 mr-3">{leave.employee_name}</h4>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {leave.leave_type}
                </span>
              </div>
              <p className="text-slate-500 text-sm mb-1">
                {leave.start_date} to {leave.end_date}
              </p>
              {/* Truncate reason for LIST view, full in modal */}
              <p className="text-slate-600 text-sm mt-2 italic truncate max-w-md">
                "{leave.reason}"
              </p>

              {user.role === UserRole.ADMIN && leave.ai_recommendation && (
                <div className="mt-3 p-2 bg-purple-50 border border-purple-100 rounded-lg inline-block">
                  <span className="text-xs font-bold text-purple-700 flex items-center">
                    ✨ AI Insight: <span className="font-normal ml-1 text-purple-600">{leave.ai_recommendation}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 mt-4 md:mt-0" onClick={(e) => e.stopPropagation()}>
              {user.role === UserRole.ADMIN && leave.status === 'Pending' ? (
                <>
                  <button
                    onClick={() => handleAction(leave.id, 'Rejected')}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center font-medium"
                  >
                    <XCircle size={18} className="mr-2" /> Reject
                  </button>
                  <button
                    onClick={() => handleAction(leave.id, 'Approved')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center font-medium shadow-sm"
                  >
                    <CheckCircle size={18} className="mr-2" /> Approve
                  </button>
                </>
              ) : (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center ${leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                  leave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                  {leave.status === 'Approved' ? <CheckCircle size={16} className="mr-1" /> :
                    leave.status === 'Rejected' ? <XCircle size={16} className="mr-1" /> : <Clock size={16} className="mr-1" />}
                  {leave.status}
                </span>
              )}
            </div>
          </div>
        ))}

        {leaves.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            {user.role === UserRole.ADMIN ? 'No pending leave applications found.' : 'No leave history found.'}
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Apply for Leave</h3>
              <button onClick={() => setIsApplyModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                <select
                  required
                  className="w-full border border-slate-200 rounded-lg p-2"
                  value={newLeave.leave_type}
                  onChange={e => setNewLeave({ ...newLeave, leave_type: e.target.value as any })}
                >
                  <option value="Sick">Sick</option>
                  <option value="Casual">Casual</option>
                  <option value="Earned">Earned</option>
                  <option value="Maternity">Maternity</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2"
                    value={newLeave.start_date}
                    onChange={e => setNewLeave({ ...newLeave, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2"
                    value={newLeave.end_date}
                    onChange={e => setNewLeave({ ...newLeave, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <textarea
                  required
                  className="w-full border border-slate-200 rounded-lg p-2"
                  rows={3}
                  value={newLeave.reason}
                  onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                  placeholder="Please provide a reason for your leave..."
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW Leave Modal */}
      {isViewModalOpen && selectedLeave && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Leave Details</h3>
              <button onClick={() => setIsViewModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Employee</label>
                <p className="text-lg font-medium text-slate-900">{selectedLeave.employee_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Type</label>
                  <p className="text-slate-700">{selectedLeave.leave_type}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${selectedLeave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      selectedLeave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                    {selectedLeave.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Duration</label>
                <p className="text-slate-700">{selectedLeave.start_date} to {selectedLeave.end_date}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Reason</label>
                <p className="text-slate-800 italic">"{selectedLeave.reason}"</p>
              </div>
              {selectedLeave.ai_recommendation && user.role === UserRole.ADMIN && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <label className="text-xs text-purple-700 uppercase font-bold mb-1 flex items-center">✨ AI Recommendation</label>
                  <p className="text-purple-800 text-sm">{selectedLeave.ai_recommendation}</p>
                </div>
              )}

              <div className="flex justify-end pt-4 space-x-3">
                <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Close</button>
                {user.role === UserRole.ADMIN && selectedLeave.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => { handleAction(selectedLeave.id, 'Rejected'); setIsViewModalOpen(false); }}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => { handleAction(selectedLeave.id, 'Approved'); setIsViewModalOpen(false); }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;