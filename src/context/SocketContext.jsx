// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { admin, token, isLoggedIn } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Only connect if user is logged in
    if (!isLoggedIn || !admin?._id || !token) {
      if (socket) {
        console.log('🔌 Disconnecting socket...');
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create socket connection
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    console.log('🔌 Connecting to WebSocket:', API_URL);

    const newSocket = io(API_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ WebSocket Connected!', newSocket.id);
      setConnected(true);
      
      const agentId = admin?._id || admin?.id || admin?.agentId;
      console.log('🔌 Attempting to join room with ID:', agentId);

      if (agentId) {
        // Join agent room
        newSocket.emit('join_room', {
          userId: agentId,
          role: 'agent'
        });
        console.log('🚪 Sent join_room request for:', `agent_${agentId}`);
      } else {
        console.warn('⚠️ No agent ID found in admin object, room joining skipped!');
      }
      
      toast.success('Real-time updates active! 🔔');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket Disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket Connection Error:', error);
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket Reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      toast.success('Reconnected! 🔔');
    });

    // Real-time booking updates
    newSocket.on('booking_update', (data) => {
      console.log('📢 Booking Update Received:', data);
      
      // Show notification
      if (data.status === 'Accepted') {
        toast.success(
          `🎉 Good News! Driver ${data.driverName} has accepted booking ${data.bookingId?.slice(-8)}!`,
          { duration: 5000 }
        );
      } else if (data.status === 'Ongoing') {
        toast.info(
          `🚗 Trip started! Booking ${data.bookingId?.slice(-8)} is now ongoing.`,
          { duration: 5000 }
        );
      } else if (data.status === 'Completed') {
        toast.success(
          `✅ Trip completed! Booking ${data.bookingId?.slice(-8)} finished successfully.`,
          { duration: 5000 }
        );
      } else if (data.status === 'Cancelled') {
        toast.error(
          `❌ Booking ${data.bookingId?.slice(-8)} has been cancelled.`,
          { duration: 5000 }
        );
      }

      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('booking_update', { detail: data }));
    });

    // Driver location updates
    newSocket.on('driver_location_update', (data) => {
      console.log('📍 Driver Location Update:', data);
      console.log('🕐 Timestamp:', new Date().toLocaleTimeString());
      console.log('🚗 Driver ID:', data.driverId);
      console.log('📌 Coordinates:', { lat: data.latitude, lng: data.longitude });
      console.log('🧭 Heading:', data.heading);
      console.log('⚡ Speed:', data.speed);
      console.log('-----------------------------------');
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('driver_location_update', { detail: data }));
    });

    // Notification updates
    newSocket.on('new_notification', (data) => {
      console.log('🔔 New Notification:', data);
      
      toast.info(data.message || 'New notification received!', {
        duration: 4000
      });

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('new_notification', { detail: data }));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up socket connection...');
      newSocket.disconnect();
    };
  }, [isLoggedIn, admin?._id, token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
