import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../api/client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    const apiOrigin = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';
    const s = io(apiOrigin, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    s.on('answerStatusChanged', (data) => setLastEvent({ event: 'answerStatusChanged', ...data }));
    s.on('registrationApproved', (data) => setLastEvent({ event: 'registrationApproved', ...data }));
    s.on('registrationRejected', (data) => setLastEvent({ event: 'registrationRejected', ...data }));
    s.on('questionLocked', (data) => setLastEvent({ event: 'questionLocked', ...data }));
    s.on('questionFinalized', (data) => setLastEvent({ event: 'questionFinalized', ...data }));
    s.on('finalAnswerPublished', (data) => setLastEvent({ event: 'finalAnswerPublished', ...data }));
    s.on('senateQuestionCreated', (data) => setLastEvent({ event: 'senateQuestionCreated', ...data }));
    s.on('questionAssigned', (data) => setLastEvent({ event: 'questionAssigned', ...data }));
    s.on('questionClassified', (data) => setLastEvent({ event: 'questionClassified', ...data }));
    s.on('senateFinalAnswerAvailable', (data) => setLastEvent({ event: 'senateFinalAnswerAvailable', ...data }));
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, user?._id]);

  const joinQuestion = (questionId) => {
    if (socket) socket.emit('joinQuestion', questionId);
  };
  const leaveQuestion = (questionId) => {
    if (socket) socket.emit('leaveQuestion', questionId);
  };
  const joinDepartment = (departmentId) => {
    if (socket) socket.emit('joinDepartment', departmentId);
  };

  return (
    <SocketContext.Provider value={{ socket, lastEvent, joinQuestion, leaveQuestion, joinDepartment }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  return ctx || { socket: null, lastEvent: null, joinQuestion: () => {}, leaveQuestion: () => {}, joinDepartment: () => {} };
}
