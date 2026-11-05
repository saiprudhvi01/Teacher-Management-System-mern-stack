import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';

export interface RealtimeUserContext {
  userId?: string;
  role?: 'student' | 'faculty' | 'admin';
  studentId?: string;
  facultyId?: string;
  departmentId?: string;
  semester?: number | string;
  section?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private currentContext: RealtimeUserContext | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  public isConnected: boolean = false;

  public init(): Socket {
    if (this.socket) {
      return this.socket;
    }

    const token = localStorage.getItem('edutrack_token');

    this.socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.notifyConnectionState(true);
      if (this.currentContext) {
        this.socket?.emit('register_client', this.currentContext);
      }
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.notifyConnectionState(false);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[SocketService] Realtime connection warning:', error.message);
    });

    // Catch-all listener to route events to registered callbacks
    this.socket.onAny((event: string, data: any) => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach((cb) => {
          try {
            cb(data);
          } catch (e) {
            console.error(`[SocketService] Error in listener for "${event}":`, e);
          }
        });
      }
    });

    return this.socket;
  }

  public registerUser(context: RealtimeUserContext) {
    this.currentContext = context;
    if (!this.socket) {
      this.init();
    }
    if (this.socket && this.socket.connected) {
      this.socket.emit('register_client', context);
    }
  }

  public on(event: string, callback: (data: any) => void): () => void {
    if (!this.socket) {
      this.init();
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unbind function
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  public onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    callback(this.isConnected);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  private notifyConnectionState(connected: boolean) {
    this.connectionListeners.forEach((cb) => {
      try {
        cb(connected);
      } catch (err) {
        console.error('[SocketService] Connection listener error:', err);
      }
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionState(false);
    }
  }
}

export const socketService = new SocketService();

/**
 * Custom React Hook for declarative real-time event subscriptions
 */
export function useRealtimeSubscription(
  event: string | string[],
  callback: (data: any, eventName: string) => void,
  deps: any[] = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    socketService.init();
    const events = Array.isArray(event) ? event : [event];
    const unsubscribers = events.map((ev) =>
      socketService.on(ev, (data) => callbackRef.current(data, ev))
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [Array.isArray(event) ? event.join(',') : event, ...deps]);
}

/**
 * Hook to monitor real-time connection status
 */
export function useRealtimeConnectionStatus() {
  const [connected, setConnected] = useState<boolean>(socketService.isConnected);

  useEffect(() => {
    return socketService.onConnectionChange(setConnected);
  }, []);

  return connected;
}
