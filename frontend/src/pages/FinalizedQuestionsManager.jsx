import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import './Dashboard.css';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

/* ── Build rich HTML document for export ── */
function buildExportHTML(questions) {
    const rows = questions.map((q, idx) => {
        const dept = q.department?.departmentName || q.department?.name || '—';
        const date = q.createdAt
            ? new Date(q.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';
        const priority = PRIORITY_LABELS[q.priority] || q.priority || '—';
        const tags = q.tags?.length ? q.tags.join(', ') : '—';
        const finalAnswer = q.finalAnswer
            ? `<div style="margin-top:8px;padding:10px;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;">
           <strong>Final Answer:</strong><br/>${q.finalAnswer.replace(/\n/g, '<br/>')}
         </div>`
            : '';
        return `
      <div style="page-break-inside:avoid;margin-bottom:28px;padding:18px;border:1px solid #e2e8f0;border-radius:8px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:5px;padding:2px 8px;font-weight:700;font-size:12px;color:#4f46e5;">Q${idx + 1}</span>
          <h3 style="margin:0;font-size:16px;font-weight:700;color:#1e293b;">${q.title}</h3>
          <span style="margin-left:auto;background:#dcfce7;color:#16a34a;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;">FINALIZED</span>
        </div>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 10px 0;">${q.description || '—'}</p>
        <table style="width:100%;font-size:12px;border-collapse:collapse;color:#64748b;">
          <tr>
            <td style="padding:3px 10px 3px 0;"><strong>Department:</strong> ${dept}</td>
            <td style="padding:3px 10px 3px 0;"><strong>Priority:</strong> ${priority}</td>
            <td style="padding:3px 0;"><strong>Created:</strong> ${date}</td>
          </tr>
          ${tags !== '—' ? `<tr><td colspan="3" style="padding:3px 0;"><strong>Tags:</strong> ${tags}</td></tr>` : ''}
        </table>
        ${finalAnswer}
      </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Report R4 — Finalized Questions Manager</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 32px; }
  h1  { font-size: 22px; margin-bottom: 4px; }
  p.sub { color: #64748b; font-size: 13px; margin-top: 0; margin-bottom: 24px; }
  @media print {
    body { padding: 16px; }
    @page { margin: 20mm; }
  }
</style>
</head>
<body>
  <h1>📋 Report R4 — Finalized Questions Manager</h1>
  <p class="sub">Exported on ${new Date().toLocaleString('en-IN')} &nbsp;·&nbsp; ${questions.length} question(s)</p>
  ${rows}
</body>
</html>`;
}

/* ── Export handlers ── */
function exportAsPDF(questions) {
    const html = buildExportHTML(questions);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.addEventListener('load', () => {
        win.focus();
        win.print();
    });
}

function exportAsWord(questions) {
    const html = buildExportHTML(questions);
    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-r4-${Date.now()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
}

/* ── Small card used in both panels ── */
function QuestionCard({ q, idx, draggable, onDragStart, onDragEnd, isDragging }) {
    const dept = q.department?.departmentName || q.department?.name || '—';
    return (
        <div
            draggable={draggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={`finalized-q-card glass${isDragging ? ' dragging' : ''}`}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className="question-index">Q{idx + 1}</span>
                <h4 style={{ flex: 1, margin: 0, fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.3 }}>
                    {q.title}
                </h4>
            </div>
            <p className="text-muted" style={{ fontSize: '0.8125rem', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                {q.description?.slice(0, 80)}{q.description?.length > 80 ? '…' : ''}
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="badge badge-finalized">finalized</span>
                {q.priority && (
                    <span className={`badge badge-${q.priority}`}>{PRIORITY_LABELS[q.priority]}</span>
                )}
                <span className="meta">🏢 {dept}</span>
                {q.createdAt && (
                    <span className="meta">
                        🕐 {new Date(q.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                        })}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function FinalizedQuestionsManager() {
    const [allFinalized, setAllFinalized] = useState([]);
    const [selected, setSelected] = useState([]); // right panel
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const selectedIds = new Set(selected.map(q => q._id));

    const draggingRef = useRef({ id: null, from: null });
    const [draggingId, setDraggingId] = useState(null);
    const [dropTarget, setDropTarget] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/questions');
                const finalized = (res.data.data || []).filter(q => q.status === 'finalized');
                setAllFinalized(finalized);
            } catch (e) {
                setError(e.response?.data?.message || 'Failed to load questions');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const leftQuestions = allFinalized.filter(q => {
        if (selectedIds.has(q._id)) return false;
        if (!search) return true;
        const s = search.toLowerCase();
        const dept = (q.department?.departmentName || q.department?.name || '').toLowerCase();
        return q.title.toLowerCase().includes(s) || dept.includes(s) ||
            q.description?.toLowerCase().includes(s);
    });

    const handleDragStart = (q, from) => (e) => {
        draggingRef.current = { id: q._id, from };
        setDraggingId(q._id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        draggingRef.current = { id: null, from: null };
        setDraggingId(null);
        setDropTarget(null);
    };

    const handleRightDrop = (e) => {
        e.preventDefault();
        setDropTarget(null);
        const { id, from } = draggingRef.current;
        if (!id || from === 'right') return;
        const q = allFinalized.find(x => x._id === id);
        if (q && !selectedIds.has(id)) setSelected(prev => [...prev, q]);
    };

    const handleLeftDrop = (e) => {
        e.preventDefault();
        setDropTarget(null);
        const { id, from } = draggingRef.current;
        if (!id || from === 'left') return;
        setSelected(prev => prev.filter(x => x._id !== id));
    };

    const onDragOver = (panel) => (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget(panel);
    };

    const onDragLeave = () => setDropTarget(null);

    const removeFromSelected = (id) => {
        setSelected(prev => prev.filter(x => x._id !== id));
    };

    if (loading) return <div className="glass p-4">Loading finalized questions…</div>;

    return (
        <div className="dashboard-section">
            {/* Header */}
            <div className="section-header">
                <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>
                        Finalized Questions Manager
                        <span className="answer-pill" style={{ marginLeft: '0.5rem' }}>{allFinalized.length}</span>
                    </h2>
                    <p className="text-muted" style={{ fontSize: '0.8125rem', margin: 0 }}>
                        Drag questions from the left panel into the selection area. Then export as PDF or Word.
                    </p>
                </div>
            </div>

            {error && <div className="auth-error mb-2">{error}</div>}

            {/* Two-panel layout */}
            <div className="finalized-manager-grid">

                {/* ── LEFT PANEL ── */}
                <div
                    className={`finalized-panel${dropTarget === 'left' ? ' drag-over' : ''}`}
                    onDrop={handleLeftDrop}
                    onDragOver={onDragOver('left')}
                    onDragLeave={onDragLeave}
                >
                    <div className="finalized-panel-header">
                        <span className="finalized-panel-title">📋 All Finalized</span>
                        <span className="answer-pill">{leftQuestions.length}</span>
                    </div>

                    <input
                        className="finalized-search"
                        placeholder="🔍 Search by title, dept…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />

                    <div className="finalized-cards-list">
                        {leftQuestions.length === 0 ? (
                            <div className="finalized-empty-state">
                                {allFinalized.length === 0
                                    ? '✅ No finalized questions yet.'
                                    : '🎉 All finalized questions have been selected!'}
                            </div>
                        ) : (
                            leftQuestions.map((q, idx) => (
                                <QuestionCard
                                    key={q._id}
                                    q={q}
                                    idx={idx}
                                    draggable
                                    onDragStart={handleDragStart(q, 'left')}
                                    onDragEnd={handleDragEnd}
                                    isDragging={draggingId === q._id}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="finalized-divider">
                    <span className="finalized-divider-arrow">⇄</span>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div
                    className={`finalized-panel finalized-drop-zone${dropTarget === 'right' ? ' drag-over' : ''}`}
                    onDrop={handleRightDrop}
                    onDragOver={onDragOver('right')}
                    onDragLeave={onDragLeave}
                >
                    <div className="finalized-panel-header">
                        <span className="finalized-panel-title">📌 Selected</span>
                        <span className="answer-pill">{selected.length}</span>
                    </div>

                    {/* Export buttons — visible only when something is selected */}
                    {selected.length > 0 && (
                        <div className="finalized-export-bar">
                            <span className="finalized-export-label">Export selection:</span>
                            <button
                                type="button"
                                className="btn btn-export-pdf"
                                title="Export selected questions as PDF"
                                onClick={() => exportAsPDF(selected)}
                            >
                                📄 Export PDF
                            </button>
                            <button
                                type="button"
                                className="btn btn-export-word"
                                title="Export selected questions as Word document"
                                onClick={() => exportAsWord(selected)}
                            >
                                📝 Export Word
                            </button>
                        </div>
                    )}

                    <div className="finalized-cards-list">
                        {selected.length === 0 ? (
                            <div className="finalized-dropzone-placeholder">
                                <div className="finalized-dropzone-icon">⬇️</div>
                                <p>Drag questions here</p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
                                    Drop from the left panel — then export as PDF or Word
                                </p>
                            </div>
                        ) : (
                            selected.map((q, idx) => (
                                <div key={q._id} style={{ position: 'relative' }}>
                                    <QuestionCard
                                        q={q}
                                        idx={idx}
                                        draggable
                                        onDragStart={handleDragStart(q, 'right')}
                                        onDragEnd={handleDragEnd}
                                        isDragging={draggingId === q._id}
                                    />
                                    <button
                                        type="button"
                                        className="finalized-remove-btn"
                                        title="Remove from selection"
                                        onClick={() => removeFromSelected(q._id)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
