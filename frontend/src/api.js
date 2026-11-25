import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const tripService = {
  // --- AUTORYZACIJA ---
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials) => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },

  googleLogin: async (accessToken) => {
    const response = await api.post('/auth/google', { access_token: accessToken });
    return response.data;
  },

  // --- TRASY I EKO ---
  searchRoute: async (origin, destination, preferences = '') => {
    const storedUser = JSON.parse(localStorage.getItem('wayfinder_user') || 'null');
    const userEmail = storedUser?.email || localStorage.getItem('userEmail') || 'guest';
    const response = await api.post('/routes', {
      origin,
      destination,
      preferences,
      user_email: userEmail,
    });
    return response.data;
  },

  getHistory: async (limit = 15) => {
    const storedUser = JSON.parse(localStorage.getItem('wayfinder_user') || 'null');
    const userEmail = storedUser?.email || localStorage.getItem('userEmail') || '';
    const response = await api.get('/routes', {
      params: { user_email: userEmail, limit },
    });
    return response.data.data;
  },

  deleteRoute: async (id) => {
    const response = await api.delete(`/routes/${id}`);
    return response.data;
  },

  suggestStops: async (q = '', lat = null, lon = null, limit = 30) => {
    const params = { q, limit };
    if (lat !== null && lon !== null) {
      params.lat = lat;
      params.lon = lon;
    }
    const response = await api.get('/stops/suggest', { params });
    return response.data.suggestions || [];
  },

  getTimetables: async (transport = 'all', search = '') => {
    const response = await api.get('/timetables', {
      params: { transport, search },
    });
    return response.data;
  },

  getContextPreferences: async () => {
    const response = await api.get('/context/preferences');
    return response.data;
  },

    // --- CZAT AI ---
  // messages: [{ role: 'user' | 'assistant', content: '...' }]
  // Zwraca: { reply, routes: [obiekty tras jak z /routes], mode: 'ai' | 'fallback' }
  chat: async (messages, { lat = null, lon = null, language = 'pl' } = {}) => {
    const storedUser = JSON.parse(localStorage.getItem('wayfinder_user') || 'null');
    const userEmail = storedUser?.email || localStorage.getItem('userEmail') || 'guest';
    const response = await api.post(
      '/chat',
      { messages, user_email: userEmail, lat, lon, language },
      { timeout: 60000 } // AI + kilka wywołań narzędzi może chwilę potrwać
    );
    return response.data;
  },
};

export default api;