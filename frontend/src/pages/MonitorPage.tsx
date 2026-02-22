import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MonitorPage: React.FC = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [view, setView] = useState<'activity' | 'reports'>('activity');
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [view]);

    const fetchData = async () => {
        if (view === 'activity') {
            try {
                const res = await api.get('/monitor/activity');
                setMessages(res.data);
            } catch (err) {
                console.error('Failed to fetch activity', err);
            }
        } else {
            try {
                const res = await api.get('/reports');
                setReports(res.data);
            } catch (err) {
                console.error('Failed to fetch reports', err);
            }
        }
    };

    const handleKick = async (userId: string) => {
        if (!window.confirm('Are you sure you want to kick this user?')) return;
        try {
            await api.get(`/monitor/kick/${userId}`);
            alert('User kicked/suspended successfully');
            fetchData();
        } catch (err) {
            alert('Failed to kick user');
        }
    };

    const handleReportStatus = async (reportId: string, status: string) => {
        try {
            await api.post(`/reports/${reportId}/status`, { status });
            fetchData();
        } catch (err) {
            alert('Failed to update report status');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 dark:bg-black text-gray-100 p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3">
                            <Shield className="text-orange-500 h-8 w-8" />
                            Monitor Panel
                        </h1>
                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={() => setView('activity')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === 'activity' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                            >
                                Live Activity
                            </button>
                            <button
                                onClick={() => setView('reports')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === 'reports' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                            >
                                Reports ({reports.filter(r => r.status === 'pending').length})
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/lobby')}
                        className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                        Exit to Lobby
                    </button>
                </header>

                {view === 'activity' ? (
                    <div className="bg-gray-800/50 dark:bg-gray-900/50 rounded-2xl border border-gray-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-800 dark:bg-gray-900 text-gray-400 text-xs uppercase tracking-widest font-black">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Sender</th>
                                    <th className="px-6 py-4">Receiver</th>
                                    <th className="px-6 py-4">Content</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {messages.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 text-xs text-gray-500 flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-blue-400">{msg.sender?.email}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {msg.receiver ? msg.receiver.email : <span className="text-xs text-gray-500">[Public]</span>}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate text-gray-300">
                                            {msg.content}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleKick(msg.senderId)}
                                                className="text-xs bg-red-500/10 text-red-500 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                                            >
                                                Kick
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {reports.length === 0 && (
                            <div className="text-center py-20 text-gray-500">No reports found. Good job!</div>
                        )}
                        {reports.map((report) => (
                            <div key={report.id} className="bg-gray-800 dark:bg-gray-900 p-6 rounded-xl border border-gray-700 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                                            {report.status}
                                        </span>
                                        <span className="text-gray-400 text-xs">{new Date(report.createdAt).toLocaleString()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">
                                        Report against <span className="text-red-400">{report.reported?.email || 'Unknown'}</span>
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Reported by: <span className="text-blue-400">{report.reporter?.email || 'Unknown'}</span>
                                    </p>
                                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 text-gray-300 text-sm">
                                        "{report.reason}"
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {report.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleReportStatus(report.id, 'resolved')}
                                                className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700"
                                            >
                                                Resolve
                                            </button>
                                            <button
                                                onClick={() => handleReportStatus(report.id, 'dismissed')}
                                                className="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-600"
                                            >
                                                Dismiss
                                            </button>
                                            <button
                                                onClick={() => handleKick(report.reported?.id)}
                                                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 mt-2"
                                            >
                                                Kick User
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


export default MonitorPage;
