import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import './NotificationDropdown.css';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { lastEvent } = useSocket();

  useEffect(() => {
    if (!lastEvent) return;
    setNotifications((prev) => [
      { id: Date.now(), ...lastEvent, at: new Date() },
      ...prev.slice(0, 19),
    ]);
  }, [lastEvent]);

  return (
    <div className="notification-dropdown">
      <button
        type="button"
        className="btn btn-secondary icon-btn notification-icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>
      {open && (
        <div className="notification-panel glass">
          <div className="notification-panel-header">
            <h3>Notifications</h3>
            <button type="button" onClick={() => setOpen(false)}>×</button>
          </div>
          <ul className="notification-list">
            {notifications.length === 0 && (
              <li className="notification-item empty">No notifications yet.</li>
            )}
            {notifications.map((n) => (
              <li key={n.id} className="notification-item notification-enter">
                <span className="n-time">{new Date(n.at).toLocaleString()}</span>
                <span className="n-message">
                  {n.event === 'answerStatusChanged' && `Answer status: ${n.status}`}
                  {n.event === 'registrationApproved' && 'Registration approved'}
                  {n.event === 'registrationRejected' && (n.reason ? `Registration rejected: ${n.reason.slice(0, 50)}${n.reason.length > 50 ? '…' : ''}` : 'Registration rejected')}
                  {n.event === 'questionLocked' && 'Question locked'}
                  {n.event === 'questionFinalized' && 'Question finalized'}
                  {n.event === 'finalAnswerPublished' && 'Final answer published'}
                  {n.event === 'senateQuestionCreated' && 'New senate question created'}
                  {n.event === 'questionAssigned' && 'Question assigned to your department'}
                  {n.event === 'questionClassified' && 'Senate question classified by Pradhikaran'}
                  {n.event === 'senateFinalAnswerAvailable' && (
                    <>
                      Final answer available —{' '}
                      {n.url ? (
                        <a href={n.url} className="n-link">View</a>
                      ) : (
                        'Open Senate question'
                      )}
                    </>
                  )}
                  {!n.event && JSON.stringify(n)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
