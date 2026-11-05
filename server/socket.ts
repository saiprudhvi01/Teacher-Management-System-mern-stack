import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'edutrack_jwt_secret_dev_key_2025';

let io: SocketIOServer | null = null;

export interface ClientRegistrationData {
  userId?: string;
  role?: 'student' | 'faculty' | 'admin';
  studentId?: string;
  facultyId?: string;
  departmentId?: string;
  semester?: number | string;
  section?: string;
}

export function initSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    // Attempt handshake auth if token provided
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        socket.data.user = decoded;
      } catch (err) {
        // Token optional on connection; explicit join handles registration
      }
    }

    // Client registration / Room joining
    socket.on('register_client', (data: ClientRegistrationData) => {
      handleClientRegistration(socket, data);
    });

    socket.on('leave_rooms', () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
    });

    socket.on('disconnect', (reason) => {
      // Disconnection handled cleanly
    });
  });

  return io;
}

function handleClientRegistration(socket: Socket, data: ClientRegistrationData) {
  socket.data.clientInfo = data;

  // 1. Join user personal room
  if (data.userId) {
    socket.join(`user:${data.userId}`);
  }

  // 2. Join role room
  if (data.role) {
    socket.join(`role:${data.role}`);
  }

  // 3. Join student-specific rooms
  if (data.role === 'student' && data.studentId) {
    socket.join(`student:${data.studentId}`);
    if (data.departmentId && data.semester) {
      const sec = data.section || 'A';
      socket.join(`cohort:${data.departmentId}:${data.semester}:${sec}`);
      socket.join(`cohort:${data.departmentId}:${data.semester}`);
      socket.join(`dept:${data.departmentId}`);
    }
  }

  // 4. Join faculty-specific rooms
  if (data.role === 'faculty' && data.facultyId) {
    socket.join(`faculty:${data.facultyId}`);
    if (data.departmentId) {
      socket.join(`dept:${data.departmentId}`);
    }
  }

  // 5. Admin joins admin + global rooms
  if (data.role === 'admin') {
    socket.join('admin:system');
  }

  socket.emit('registered', {
    status: 'connected',
    rooms: Array.from(socket.rooms),
    timestamp: new Date().toISOString()
  });
}

export function getIO(): SocketIOServer | null {
  return io;
}

// Broadcasters for all domain events

export function emitToStudent(studentId: string, event: string, payload: any) {
  if (!io) return;
  io.to(`student:${studentId}`).emit(event, { ...payload, timestamp: new Date().toISOString() });
}

export function emitToCohort(deptId: string, semester: number | string, section: string, event: string, payload: any) {
  if (!io) return;
  // Emit to specific section
  io.to(`cohort:${deptId}:${semester}:${section}`).emit(event, { ...payload, timestamp: new Date().toISOString() });
  // Also emit to whole semester cohort
  io.to(`cohort:${deptId}:${semester}`).emit(event, { ...payload, timestamp: new Date().toISOString() });
}

export function emitToFaculty(facultyId: string, event: string, payload: any) {
  if (!io) return;
  io.to(`faculty:${facultyId}`).emit(event, { ...payload, timestamp: new Date().toISOString() });
}

export function emitToSubject(subjectId: string, event: string, payload: any) {
  if (!io) return;
  io.to(`subject:${subjectId}`).emit(event, { ...payload, timestamp: new Date().toISOString() });
}

export function emitToRole(role: 'admin' | 'faculty' | 'student', event: string, payload: any) {
  if (!io) return;
  io.to(`role:${role}`).emit(event, { ...payload, timestamp: new Date().toISOString() });
}

export function emitToAll(event: string, payload: any) {
  if (!io) return;
  io.emit(event, { ...payload, timestamp: new Date().toISOString() });
}
