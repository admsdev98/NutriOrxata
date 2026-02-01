const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('nutriorxata_token');
}

function setToken(token) {
  localStorage.setItem('nutriorxata_token', token);
}

function removeToken() {
  localStorage.removeItem('nutriorxata_token');
}

function getUser() {
  const user = localStorage.getItem('nutriorxata_user');
  return user ? JSON.parse(user) : null;
}

function setUser(user) {
  localStorage.setItem('nutriorxata_user', JSON.stringify(user));
}

function removeUser() {
  localStorage.removeItem('nutriorxata_user');
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const token = getToken();
  const { skipAuthRedirect, ...requestOptions } = options;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...requestOptions.headers,
    },
    ...requestOptions,
  };

  if (requestOptions.body && typeof requestOptions.body === 'object') {
    config.body = JSON.stringify(requestOptions.body);
  }

  const response = await fetch(url, config);
  
  if (response.status === 401 && !skipAuthRedirect) {
    removeToken();
    removeUser();
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

export const api = {
  auth: {
    login: async (email, password) => {
      const response = await request('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuthRedirect: true,
      });
      setToken(response.access_token);
      setUser(response.usuario);
      return response;
    },
    logout: () => {
      removeToken();
      removeUser();
    },
    me: () => request('/api/auth/me'),
    getUser,
    getToken,
    isAuthenticated: () => !!getToken(),
    isAdmin: () => {
      const user = getUser();
      return user?.rol === 'admin';
    },
    register: (data) => request('/api/auth/register', { method: 'POST', body: data }),
    listUsers: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/api/auth/usuarios${query ? `?${query}` : ''}`);
    },
    deleteUser: (id) => request(`/api/auth/usuarios/${id}`, { method: 'DELETE' }),
    updateUser: (id, data) => request(`/api/auth/usuarios/${id}`, { method: 'PUT', body: data }),
  },

  ingredientes: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/api/ingredientes${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/api/ingredientes/${id}`),
    create: (data) => request('/api/ingredientes', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/ingredientes/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/api/ingredientes/${id}`, { method: 'DELETE' }),
    categorias: () => request('/api/ingredientes/categorias'),
  },

  platos: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/api/platos${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/api/platos/${id}`),
    create: (data) => request('/api/platos', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/platos/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/api/platos/${id}`, { method: 'DELETE' }),
    addIngrediente: (platoId, data) => 
      request(`/api/platos/${platoId}/ingredientes`, { method: 'POST', body: data }),
    updateIngrediente: (platoId, ingredienteId, data) => 
      request(`/api/platos/${platoId}/ingredientes/${ingredienteId}`, { method: 'PUT', body: data }),
    removeIngrediente: (platoId, ingredienteId) => 
      request(`/api/platos/${platoId}/ingredientes/${ingredienteId}`, { method: 'DELETE' }),
  },

  planificacion: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/api/planificacion${query ? `?${query}` : ''}`);
    },
    resumen: (clientId, semanaInicio) => {
      const params = semanaInicio ? `?semana_inicio=${semanaInicio}` : '';
      return request(`/api/planificacion/resumen/${clientId}${params}`);
    },
    create: (data) => request('/api/planificacion', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/planificacion/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/api/planificacion/${id}`, { method: 'DELETE' }),
  },

  clientesPlatos: {
    list: (clientId) => request(`/api/clientes/${clientId}/platos`),
    create: (clientId, data) => request(`/api/clientes/${clientId}/platos`, { method: 'POST', body: data }),
    update: (clientId, clientePlatoId, data) =>
      request(`/api/clientes/${clientId}/platos/${clientePlatoId}`, { method: 'PUT', body: data }),
    delete: (clientId, clientePlatoId) =>
      request(`/api/clientes/${clientId}/platos/${clientePlatoId}`, { method: 'DELETE' }),
  },

  health: () => request('/api/health'),
};

export default api;
