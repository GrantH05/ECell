export interface User {
  _id: string;  // ← ADD THIS
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  year: number;
  phone: string;
  role: 'member' | 'admin';
  registeredEvents?: string[];
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  type: 'workshop' | 'seminar' | 'competition' | 'networking' | 'other';
  maxParticipants: number;
  registeredUsers: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  imageUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}