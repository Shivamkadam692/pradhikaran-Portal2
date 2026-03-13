import React, { useState, useEffect } from 'react';
import api from '../api/client';
import './Dashboard.css';

const REPORTS = [
    {
        key: 'r1',
        title: 'R1 — Received Questions Report',
        subtitle: 'प्राप्त प्रश्न अहवाल',
        description: 'All questions received from Senate members — pending, approved, rejected, and forwarded. Grouped by senate member.',
        endpoint: '/export/report-r1',
        color: '#3B82F6',
        icon: '📥',
    },
    {
        key: 'r2',
        title: 'R2 — Sorted Questions Report',
        subtitle: 'वर्गीकृत प्रश्न अहवाल',
        description: 'All approved & forwarded questions sent to Pradhikaran. Grouped by senate member.',
        endpoint: '/export/report-r2',
        color: '#8B5CF6',
        icon: '📊',
    },
    {
        key: 'r3',
        title: 'R3 — Finalized Q&A Report',
        subtitle: 'अंतिम प्रश्न व उत्तरे अहवाल',
        description: 'All finalized questions with accepted answers and published final answers. Grouped by senate member.',
        endpoint: '/export/report-r3',
        color: '#10B981',
        icon: '✅',
    },
    {
        key: 'r4',
        title: 'R4 — Complete Q&A Report',
        subtitle: 'संपूर्ण प्रश्न व उत्तरे अहवाल',
        description: 'Comprehensive report of all questions with all answers and final published answers. Grouped by senate member.',
        endpoint: '/export/report-r4',
        color: '#F59E0B',
        icon: '📑',
    },
];

export default function ReportsManager() {
    const [generating, setGenerating] = useState('');
    const [error, setError] = useState('');
    const [receivedReports, setReceivedReports] = useState([]);
    const [loadingReceived, setLoadingReceived] = useState(true);
    const [downloadingId, setDownloadingId] = useState('');

    useEffect(() => {
        loadReceivedReports();
    }, []);

    const loadReceivedReports = async () => {
        try {
            const { data } = await api.get('/reports');
            setReceivedReports(data.data || []);
        } catch (e) {
            // silently fail — reports listing is supplementary
        } finally {
            setLoadingReceived(false);
        }
    };

    const handleDownload = async (report) => {
        setGenerating(report.key);
        setError('');
        try {
            const response = await api.get(report.endpoint, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${report.key}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            setError(e.response?.data?.message || `Failed to generate ${report.title}`);
        } finally {
            setGenerating('');
        }
    };

    const handleDownloadReceived = async (reportId) => {
        setDownloadingId(reportId);
        try {
            const response = await api.get(`/reports/${reportId}/download`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `received-report-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to download report');
        } finally {
            setDownloadingId('');
        }
    };

    return (
        <div>
            <div className="section-header">
                <h2>📋 Reports Manager</h2>
            </div>

            {error && <div className="auth-error mb-2">{error}</div>}

            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {REPORTS.map((report) => (
                    <div
                        key={report.key}
                        className="glass card"
                        style={{
                            borderTop: `4px solid ${report.color}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.75rem' }}>{report.icon}</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{report.title}</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--page-text-muted)' }}>{report.subtitle}</span>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: 'var(--page-text-muted)', lineHeight: 1.5, margin: 0 }}>
                            {report.description}
                        </p>

                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ marginTop: 'auto', width: '100%' }}
                            disabled={!!generating}
                            onClick={() => handleDownload(report)}
                        >
                            {generating === report.key ? (
                                <>⏳ Generating PDF...</>
                            ) : (
                                <>📄 Generate & Download</>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Received Reports from Auditor */}
            <div className="section-header" style={{ marginTop: '2rem' }}>
                <h2>📨 Received Reports from Auditor</h2>
            </div>

            {loadingReceived ? (
                <div className="glass p-4">Loading received reports…</div>
            ) : receivedReports.length === 0 ? (
                <p className="text-muted">No reports received from auditors yet.</p>
            ) : (
                <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
                    {receivedReports.map((r) => (
                        <div
                            key={r._id}
                            className="glass card"
                            style={{
                                borderTop: '4px solid #F59E0B',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>📨</span>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                                        {r.reportType} Report
                                    </h4>
                                    <span className="meta">
                                        Sent by: {r.sentBy?.name || r.sentBy?.email || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--page-text-muted)' }}>
                                📅 {new Date(r.sentAt).toLocaleString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ marginTop: 'auto', width: '100%' }}
                                disabled={!!downloadingId}
                                onClick={() => handleDownloadReceived(r._id)}
                            >
                                {downloadingId === r._id ? '⏳ Downloading...' : '📄 Download PDF'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

