import React, { useState, useEffect } from 'react';
import { Bell, Search, Check, Clock, AlertTriangle, CheckCircle, Info, Filter } from 'lucide-react';
import { ApiService } from '../services/api';
import { Notification, User } from '../types';

interface NotificationsProps {
    user: User;
    onNavigate: (page: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ user, onNavigate }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read

    useEffect(() => {
        loadNotifications();
    }, [user]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const userType = user.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
            const data = await ApiService.getNotifications(user.id, userType);
            setNotifications(data || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.read) {
            await ApiService.markNotificationRead(notif.id);
            // Update local state without reload
            setNotifications(prev => prev.map(n =>
                n.id === notif.id ? { ...n, read: true } : n
            ));
        }

        // Smart Navigation logic
        // @ts-ignore
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

            onNavigate('tasks', { search: searchTerm } as any);
        } else if (textStr.includes('leave') || textStr.includes('approval')) {
            onNavigate('leaves');
        } else if (textStr.includes('payroll') || textStr.includes('payslip') || textStr.includes('salary')) {
            onNavigate('payroll');
        } else if (textStr.includes('performance') || textStr.includes('appreciation')) {
            onNavigate('dashboard');
        }
    };

    const handleMarkAsRead = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); // Prevent navigation when clicking 'Mark as Read'
        try {
            await ApiService.markNotificationRead(id);
            // Update local state
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            // In a real app we'd have a bulk endpoint, for now we just loop or reload
            // Assuming we just update UI for responsiveness
            const unread = notifications.filter(n => !n.read);
            for (const n of unread) {
                await ApiService.markNotificationRead(n.id);
            }
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'read') return n.read;
        return true;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-emerald-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
            case 'error': return <AlertTriangle className="text-red-500" size={20} />;
            default: return <Info className="text-blue-500" size={20} />;
        }
    };

    const formatTime = (dateString: string) => {
        const timeStr = dateString.endsWith('Z') || dateString.includes('+') ? dateString : dateString + 'Z';
        return new Date(timeStr).toLocaleString();
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Bell className="mr-3 text-blue-600" /> Notifications
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your alerts and messages</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleMarkAllRead}
                        className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center text-slate-600"
                    >
                        <Check className="mr-2" size={16} /> Mark all as read
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-6 inline-flex">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    Unread
                </button>
                <button
                    onClick={() => setFilter('read')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'read' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    Read
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading notifications...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No notifications</h3>
                        <p className="text-slate-500">You're all caught up!</p>
                    </div>
                ) : (
                    filteredNotifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`bg-white rounded-xl p-5 border transition-all cursor-pointer hover:shadow-lg ${!notif.read ? 'border-l-4 border-l-blue-500 shadow-md' : 'border-slate-200 opacity-75 hover:opacity-100'}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${!notif.read ? 'bg-blue-50' : 'bg-slate-100'}`}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-semibold text-lg ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>{notif.title}</h3>
                                        <span className="text-xs text-slate-500 flex items-center bg-slate-50 px-2 py-1 rounded">
                                            <Clock size={12} className="mr-1" /> {formatTime(notif.createdAt)}
                                        </span>
                                    </div>
                                    {/* @ts-ignore */}
                                    <p className="text-slate-600 mt-1 mb-3">{notif.body || notif.message}</p>

                                    {!notif.read && (
                                        <button
                                            onClick={(e) => handleMarkAsRead(e, notif.id)}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center bg-slate-50 px-3 py-1 rounded-lg"
                                        >
                                            Mark as read <Check size={14} className="ml-1" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
