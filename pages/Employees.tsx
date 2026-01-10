import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { Employee } from '../types';
import { Plus, Search, Filter, MoreVertical, Trash2, Edit2, X, Phone, Mail, MapPin, UserX } from 'lucide-react';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  // ... existing state ...

  // Initialize Keyboard Navigation
  const { containerRef: tableBodyRef } = useKeyboardNavigation({
    itemSelector: 'tr[data-nav-item]',
    axis: 'vertical'
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({
    full_name: '', email: '', phone: '', department: 'Engineering', designation: '', salary: 0, joining_date: '', password: '', address: ''
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFireModal, setShowFireModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmp, setEditEmp] = useState({
    full_name: '', email: '', phone: '', department: '', designation: '', salary: 0, joining_date: '', address: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // New state for editing contact details directly in the modal
  const [contactForm, setContactForm] = useState({ email: '', phone: '', address: '' });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const data = await ApiService.getEmployees();
    setEmployees(data);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.password) {
      alert('Please set a password for the employee');
      return;
    }
    await ApiService.createEmployee(newEmp);
    setIsModalOpen(false);
    loadEmployees();
    // Reset form
    setNewEmp({ full_name: '', email: '', phone: '', department: 'Engineering', designation: '', salary: 0, joining_date: '', password: '', address: '' });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      await ApiService.deleteEmployee(id);
      loadEmployees();
    }
  };

  const handleFireEmployee = async () => {
    if (selectedEmployee && window.confirm(`Are you sure you want to fire ${selectedEmployee.full_name}?`)) {
      await ApiService.updateEmployeeStatus(selectedEmployee.id, 'Terminated');
      setShowFireModal(false);
      setSelectedEmployee(null);
      loadEmployees();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployee) {
      try {
        await ApiService.updateEmployee(selectedEmployee.id, editEmp);
        setShowEditModal(false);
        setSelectedEmployee(null);
        loadEmployees();
      } catch (error) {
        alert('Failed to update employee. Please try again.');
      }
    }
  };

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleViewEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDetailModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Update logic when opening contact modal
  const openContactModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setContactForm({
      email: emp.email,
      phone: emp.phone || '',
      address: emp.address || ''
    });
    setShowContactModal(true);
  };

  const handleContactSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      await ApiService.updateEmployee(selectedEmployee.id, {
        ...selectedEmployee,
        email: contactForm.email,
        phone: contactForm.phone,
        address: contactForm.address,
        // Backend expects full object or partial? Usually partial update is safer if supported, 
        // but here I'll assume updateEmployee merges or replaces. 
        // Re-using exiting updateEmployee which takes an interface.
        // We need to pass all required fields if the backend replaces.
        // Let's assume partial mostly works or pass existing fields.
        full_name: selectedEmployee.full_name,
        department: selectedEmployee.department,
        designation: selectedEmployee.designation,
        salary: selectedEmployee.salary,
        joining_date: selectedEmployee.joining_date,
      });
      setShowContactModal(false);
      loadEmployees();
    } catch (error) {
      alert('Failed to update contact details.');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        {/* ... existing header content ... */}
        {/* (Skipping re-writing header, just ensuring structure is implicitly maintained by replacing surrounding if needed, but here I'll try to target specific blocks or use larger replacement if safe) */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employees</h2>
          <p className="text-slate-500">Manage your workforce directory</p>
        </div>

        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          {employees.some(e => e.status === 'Terminated') && (
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to PERMANENTLY delete all terminated employees? This action cannot be undone.')) {
                  try {
                    const result = await ApiService.deleteTerminatedEmployees();
                    alert(result.message);
                    loadEmployees();
                  } catch (e) {
                    alert('Failed to delete terminated employees.');
                  }
                }
              }}
              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium flex items-center hover:bg-red-200 transition-colors border border-red-200"
            >
              <Trash2 size={20} className="mr-2" />
              Cleanup Terminated
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody ref={tableBodyRef} className="divide-y divide-slate-100">
            {filteredEmployees.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-slate-50 transition-colors focus:outline-none focus:bg-blue-50 cursor-pointer"
                tabIndex={0}
                data-nav-item
                onClick={() => handleViewEmployee(emp)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleViewEmployee(emp);
                }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3">
                      {emp.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{emp.full_name}</div>
                      <div className="text-sm text-slate-500">{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900">{emp.designation}</div>
                  <div className="text-xs text-slate-500">{emp.department}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${emp.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-16 bg-slate-200 rounded-full h-1.5 mr-2">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${emp.performance_score}%` }}></div>
                    </div>
                    <span className="text-xs font-medium text-slate-600">{emp.performance_score}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${emp.attrition_risk === 'High' ? 'text-red-600 bg-red-50' :
                    emp.attrition_risk === 'Medium' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                    }`}>
                    {emp.attrition_risk}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400" onClick={(e) => e.stopPropagation()}>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openContactModal(emp)}
                      className="p-1 hover:text-blue-600"
                      title="View/Edit Contact Details"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setEditEmp({
                          full_name: emp.full_name,
                          email: emp.email,
                          phone: emp.phone,
                          department: emp.department,
                          designation: emp.designation,
                          salary: emp.salary,
                          joining_date: emp.joining_date,
                          address: emp.address || ''
                        });
                        setShowEditModal(true);
                      }}
                      className="p-1 hover:text-blue-600"
                      title="Edit Employee"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => { setSelectedEmployee(emp); setShowFireModal(true); }}
                      className="p-1 hover:text-red-600"
                      title="Fire Employee"
                    >
                      <UserX size={16} />
                    </button>
                    <button onClick={() => handleDelete(emp.id)} className="p-1 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ... existing Modals (Add, Contact, Fire, Edit) ... */}
      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          {/* ... modal content ... */}
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Add New Employee</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {/* Re-using exact existing form content to ensure no regression */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input type="text" required className="w-full border border-slate-200 rounded-lg p-2"
                    value={newEmp.full_name} onChange={e => setNewEmp({ ...newEmp, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" required className="w-full border border-slate-200 rounded-lg p-2"
                    value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input type="tel" required className="w-full border border-slate-200 rounded-lg p-2"
                  value={newEmp.phone} onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2"
                    value={newEmp.department} onChange={e => setNewEmp({ ...newEmp, department: e.target.value })}
                  >
                    <option>Engineering</option>
                    <option>Sales</option>
                    <option>Marketing</option>
                    <option>HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                  <input type="text" required className="w-full border border-slate-200 rounded-lg p-2"
                    value={newEmp.designation} onChange={e => setNewEmp({ ...newEmp, designation: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary (Annual in ₹)</label>
                  <input type="number" required className="w-full border border-slate-200 rounded-lg p-2"
                    value={newEmp.salary || ''}
                    onChange={e => setNewEmp({ ...newEmp, salary: Number(e.target.value) })}
                    onKeyDown={(e) => {
                      // Allow only numbers, backspace, delete, tab, arrows
                      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Enter annual salary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
                  <input type="date" required className="w-full border border-slate-200 rounded-lg p-2"
                    value={newEmp.joining_date} onChange={e => setNewEmp({ ...newEmp, joining_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg p-2"
                  rows={2}
                  value={newEmp.address}
                  onChange={e => setNewEmp({ ...newEmp, address: e.target.value })}
                  placeholder="Employee address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2"
                  value={newEmp.password}
                  onChange={e => setNewEmp({ ...newEmp, password: e.target.value })}
                  placeholder="Set login password for employee"
                />
                <p className="text-xs text-slate-500 mt-1">Employee will use this password to login</p>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/View Contact Details Modal */}
      {showContactModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Contact Details</h3>
              <button onClick={() => { setShowContactModal(false); setSelectedEmployee(null); }}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleContactSave} className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="text-blue-600" size={20} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 block mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Phone className="text-green-600" size={20} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 block mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={contactForm.phone}
                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="Add phone number"
                  />
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="text-purple-600" size={20} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 block mb-1">Address</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={2}
                    value={contactForm.address}
                    onChange={e => setContactForm({ ...contactForm, address: e.target.value })}
                    placeholder="Add address"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fire Employee Modal */}
      {showFireModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-red-900">Fire Employee</h3>
              <button onClick={() => { setShowFireModal(false); setSelectedEmployee(null); }}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4">
                Are you sure you want to fire <strong>{selectedEmployee.full_name}</strong>? This action will change their status to "Terminated".
              </p>
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be easily undone. The employee will lose access to the system.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setShowFireModal(false); setSelectedEmployee(null); }}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFireEmployee}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Fire Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Edit Employee</h3>
              <button onClick={() => { setShowEditModal(false); setSelectedEmployee(null); }}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Re-using existing edit form fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input type="text" required className="w-full border border-slate-200 rounded-lg p-2"
                    value={editEmp.full_name} onChange={e => setEditEmp({ ...editEmp, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" required className="w-full border border-slate-200 rounded-lg p-2"
                    value={editEmp.email} onChange={e => setEditEmp({ ...editEmp, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="text" required className="w-full border border-slate-200 rounded-lg p-2"
                    value={editEmp.phone} onChange={e => setEditEmp({ ...editEmp, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2"
                    value={editEmp.department} onChange={e => setEditEmp({ ...editEmp, department: e.target.value })}
                  >
                    <option>Engineering</option>
                    <option>Sales</option>
                    <option>Marketing</option>
                    <option>HR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                  <input type="text" required className="w-full border border-slate-200 rounded-lg p-2"
                    value={editEmp.designation} onChange={e => setEditEmp({ ...editEmp, designation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary (Annual in ₹)</label>
                  <input type="number" required className="w-full border border-slate-200 rounded-lg p-2"
                    value={editEmp.salary || ''} onChange={e => setEditEmp({ ...editEmp, salary: Number(e.target.value) })}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg p-2"
                  rows={2}
                  value={editEmp.address}
                  onChange={e => setEditEmp({ ...editEmp, address: e.target.value })}
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedEmployee(null); }}
                  className="px-4 py-2 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Detail View Employee Modal */}
      {isDetailModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-end p-6">
                <div className="h-20 w-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-slate-700 translate-y-10">
                  {selectedEmployee.full_name.charAt(0)}
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="pt-12 px-8 pb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedEmployee.full_name}</h2>
                  <p className="text-slate-500 font-medium">{selectedEmployee.designation}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${selectedEmployee.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                  {selectedEmployee.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Column 1: Personal & Contact */}
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                      <span className="w-1 h-4 bg-blue-500 rounded mr-2"></span>
                      Contact Information
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600 mr-3">
                          <Mail size={18} />
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Email Address</span>
                          <span className="text-sm font-medium text-slate-900">{selectedEmployee.email}</span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-white p-2 rounded-lg shadow-sm text-green-600 mr-3">
                          <Phone size={18} />
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Phone Number</span>
                          <span className="text-sm font-medium text-slate-900">{selectedEmployee.phone}</span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-white p-2 rounded-lg shadow-sm text-purple-600 mr-3">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Address</span>
                          <span className="text-sm font-medium text-slate-900">{selectedEmployee.address || 'Not Provided'}</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Column 2: Job & Performance */}
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                      <span className="w-1 h-4 bg-indigo-500 rounded mr-2"></span>
                      Job Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Department</span>
                        <span className="text-sm font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
                          {selectedEmployee.department}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Joining Date</span>
                        <span className="text-sm font-medium text-slate-900">
                          {new Date(selectedEmployee.joining_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-slate-500 block mb-1">Annual Salary</span>
                        <span className="text-lg font-bold text-slate-900">
                          {formatCurrency(selectedEmployee.salary)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                      <span className="w-1 h-4 bg-amber-500 rounded mr-2"></span>
                      Performance
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 font-medium">Performance Score</span>
                          <span className="font-bold text-slate-900">{selectedEmployee.performance_score}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${selectedEmployee.performance_score}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Attrition Risk</span>
                        <span className={`text-sm font-bold px-3 py-1 rounded-lg inline-flex items-center space-x-2 ${selectedEmployee.attrition_risk === 'High' ? 'bg-red-100 text-red-700 border border-red-200' :
                          selectedEmployee.attrition_risk === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                          <span>{selectedEmployee.attrition_risk} Risk</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 border-t border-slate-100 pt-6">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Switch to edit mode
                    setIsDetailModalOpen(false);
                    setEditEmp({
                      full_name: selectedEmployee.full_name,
                      email: selectedEmployee.email,
                      phone: selectedEmployee.phone,
                      department: selectedEmployee.department,
                      designation: selectedEmployee.designation,
                      salary: selectedEmployee.salary,
                      joining_date: selectedEmployee.joining_date,
                      address: selectedEmployee.address || ''
                    });
                    setShowEditModal(true);
                  }}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm flex items-center"
                >
                  <Edit2 size={18} className="mr-2" /> Edit Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;