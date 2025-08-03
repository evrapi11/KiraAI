import axios from 'axios';
import { 
  User, 
  UserCreate, 
  JournalEntry, 
  JournalEntryCreate, 
  JournalEntryUpdate,
  StrategicPlan,
  AuthToken,
  BigFiveTraits
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (username: string, password: string): Promise<AuthToken> => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  register: async (userData: UserCreate): Promise<User> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Journal API
export const journalAPI = {
  getEntries: async (skip = 0, limit = 20): Promise<JournalEntry[]> => {
    const response = await api.get(`/journal/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getEntry: async (id: string): Promise<JournalEntry> => {
    const response = await api.get(`/journal/${id}`);
    return response.data;
  },

  createEntry: async (entry: JournalEntryCreate): Promise<JournalEntry> => {
    const response = await api.post('/journal/', entry);
    return response.data;
  },

  updateEntry: async (id: string, entry: JournalEntryUpdate): Promise<JournalEntry> => {
    const response = await api.put(`/journal/${id}`, entry);
    return response.data;
  },

  deleteEntry: async (id: string): Promise<void> => {
    await api.delete(`/journal/${id}`);
  },
};

// Traits API
export const traitsAPI = {
  getTraits: async (): Promise<BigFiveTraits> => {
    const response = await api.get('/traits/');
    return response.data;
  },

  getTraitsHistory: async (): Promise<any[]> => {
    const response = await api.get('/traits/history');
    return response.data;
  },
};

// Strategic Plan API
export const strategicPlanAPI = {
  generatePlan: async (): Promise<StrategicPlan> => {
    const response = await api.post('/strategic-plan/generate');
    return response.data;
  },

  getPlanHistory: async (skip = 0, limit = 10): Promise<StrategicPlan[]> => {
    const response = await api.get(`/strategic-plan/history?skip=${skip}&limit=${limit}`);
    return response.data;
  },
};

export default api;