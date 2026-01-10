import React, { useEffect, useState } from 'react';
import { User, UserRole, Task, Employee } from '../types';
import { Plus, CheckCircle, Clock, AlertCircle, Trash2, Edit2, Calendar, User as UserIcon, X } from 'lucide-react';
import { ApiService } from '../services/api';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface TasksProps {
  user?: User;
  initialSearch?: string;
}

const Tasks: React.FC<TasksProps> = ({ user, initialSearch }) => {
  const isAdmin = user?.role === UserRole.ADMIN;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    employee_id: 0,
    title: '',
    description: '',
    priority: 'Medium',
    due_date: ''
  });

  const { containerRef: tasksListRef } = useKeyboardNavigation({
    itemSelector: '[data-nav-item]',
    axis: 'vertical',
    onSelect: (index, el) => {
      // Optional: scroll into view or something
    }
  });

  useEffect(() => {
    loadTasks();
    if (isAdmin) {
      loadEmployees();
    }
  }, [user]);

  useEffect(() => {
    if (initialSearch && tasks.length > 0) {
      const match = tasks.find(t => initialSearch.toLowerCase().includes(t.title.toLowerCase()));
      if (match) {
        setSelectedTask(match);
        setShowEditModal(true);
      }
    }
  }, [initialSearch, tasks]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const employeeId = isAdmin ? undefined : user?.id;
      const data = await ApiService.getTasks(employeeId);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await ApiService.getEmployees();
      setEmployees(data.filter(emp => emp.status === 'Active'));
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createTask(newTask);
      alert('Task created successfully!');
      setShowAddModal(false);
      setNewTask({ employee_id: 0, title: '', description: '', priority: 'Medium', due_date: '' });
      loadTasks();
    } catch (error: any) {
      alert(`Failed to create task: ${error.message || 'Please try again.'}`);
    }
  };

  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      await ApiService.updateTask(taskId, updates);
      loadTasks();
    } catch (error: any) {
      alert(`Failed to update task: ${error.message || 'Please try again.'}`);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await ApiService.deleteTask(taskId);
        alert('Task deleted successfully!');
        loadTasks();
      } catch (error: any) {
        alert(`Failed to delete task: ${error.message || 'Please try again.'}`);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pending': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'In Progress': return <Clock size={16} className="text-blue-600" />;
      case 'Pending': return <AlertCircle size={16} className="text-slate-600" />;
      default: return <AlertCircle size={16} />;
    }
  };

  const filteredTasks = tasks;
  const pendingTasks = filteredTasks.filter(t => t.status === 'Pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'In Progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{isAdmin ? 'Task Management' : 'My Tasks'}</h2>
          <p className="text-slate-500">{isAdmin ? 'Assign and manage tasks for employees' : 'View and manage your assigned tasks'}</p>
        </div>
        {isAdmin && (
          <div className="flex space-x-3">
            {completedTasks.length > 0 && (
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to PERMANENTLY delete all COMPLETED tasks?')) {
                    try {
                      const result = await ApiService.cleanupCompletedTasks();
                      alert(result.message);
                      loadTasks();
                    } catch (e) {
                      alert('Failed to cleanup completed tasks.');
                    }
                  }
                }}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-200 transition-colors flex items-center border border-red-200"
              >
                <Trash2 size={18} className="mr-2" />
                Cleanup Completed
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Assign Task
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{pendingTasks.length}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <AlertCircle size={24} className="text-slate-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">In Progress</p>
              <p className="text-2xl font-bold text-slate-900">{inProgressTasks.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-slate-900">{completedTasks.length}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">




        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="text-lg font-medium mb-2">No tasks found</p>
            <p className="text-sm">{isAdmin ? 'Assign a task to get started' : 'You have no assigned tasks'}</p>
          </div>
        ) : (
          <div ref={tasksListRef} className="divide-y divide-slate-100">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                data-nav-item
                tabIndex={0}
                className="p-6 hover:bg-slate-50 transition-colors cursor-pointer outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => { setSelectedTask(task); setShowEditModal(true); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedTask(task);
                    setShowEditModal(true);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="font-semibold text-slate-900 text-lg">{task.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-slate-600 text-sm mb-3 ml-7 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center space-x-4 ml-7 text-sm text-slate-500">
                      {isAdmin && (
                        <div className="flex items-center">
                          <UserIcon size={14} className="mr-1" />
                          <span>{task.employee_name}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}
                      <span>Created: {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!isAdmin && task.status !== 'Completed' && (
                      <>
                        {task.status === 'Pending' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateTask(task.id, { status: 'In Progress' }); }}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {task.status === 'In Progress' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateTask(task.id, { status: 'Completed' }); }}
                            className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setShowEditModal(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Assign New Task</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
                <select
                  required
                  className="w-full border border-slate-200 rounded-lg p-2"
                  value={newTask.employee_id}
                  onChange={(e) => setNewTask({ ...newTask, employee_id: Number(e.target.value) })}
                >
                  <option value={0}>Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} - {emp.designation}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg p-2"
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-lg p-2"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Task Details / Edit Modal */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedTask.title}</h3>
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority} Priority
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Description */}
              <div>
                <h4 className="text-sm uppercase tracking-wide text-slate-500 font-bold mb-3">Description</h4>
                <div className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedTask.description || 'No description provided.'}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-2">Assigned To</h4>
                  <div className="flex items-center font-medium text-slate-900">
                    <UserIcon size={18} className="mr-2 text-slate-400" />
                    {selectedTask.employee_name}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-2">Due Date</h4>
                  <div className="flex items-center font-medium text-slate-900">
                    <Calendar size={18} className="mr-2 text-slate-400" />
                    {selectedTask.due_date
                      ? new Date(selectedTask.due_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                      : 'No due date'}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-2">Created On</h4>
                  <div className="text-slate-900 font-medium">
                    {new Date(selectedTask.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Close
                </button>

                {!isAdmin && selectedTask.status !== 'Completed' && (
                  <>
                    {selectedTask.status === 'Pending' && (
                      <button
                        onClick={() => { handleUpdateTask(selectedTask.id, { status: 'In Progress' }); setShowEditModal(false); }}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                      >
                        Start Task
                      </button>
                    )}
                    {selectedTask.status === 'In Progress' && (
                      <button
                        onClick={() => { handleUpdateTask(selectedTask.id, { status: 'Completed' }); setShowEditModal(false); }}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5"
                      >
                        Mark as Complete
                      </button>
                    )}
                  </>
                )}

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    className="px-6 py-2.5 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                  >
                    Delete Task
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

