// API Service para conectar con el backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Obtener token del localStorage o sessionStorage
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  if (rememberMe) {
    return localStorage.getItem('token');
  } else {
    return sessionStorage.getItem('token');
  }
};

// Guardar token en el storage correspondiente
const saveToken = (token: string): void => {
  if (typeof window === 'undefined') return;

  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  if (rememberMe) {
    localStorage.setItem('token', token);
  } else {
    sessionStorage.setItem('token', token);
  }
};

// Intentar renovar el token
const attemptTokenRefresh = async (): Promise<string | null> => {
  try {
    const currentToken = getToken();
    if (!currentToken) return null;

    const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.success && data.token) {
      saveToken(data.token);
      return data.token;
    }

    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

// Helper para hacer requests autenticados con auto-renovación de token
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> => {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si el token expiró (401) y no hemos intentado renovarlo aún
  if (response.status === 401 && retryCount === 0) {
    const newToken = await attemptTokenRefresh();

    if (newToken) {
      // Reintentar la petición con el nuevo token
      return fetchWithAuth(endpoint, options, retryCount + 1);
    } else {
      // Si no se pudo renovar, redirigir al login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error en la petición' }));
    throw new Error(error.message || error.error || 'Error en la petición');
  }

  return response.json();
};

// INFONAVIT APIs
export const infonavitApi = {
  // 1. Cambiar contraseña
  cambiarPassword: async (nss: string): Promise<ApiResponse> => {
    return fetchWithAuth('/api/infonavit/cambiar-password', {
      method: 'POST',
      body: JSON.stringify({ nss }),
    });
  },

  // 2. Desvincular dispositivo
  desvincularDispositivo: async (nss: string): Promise<ApiResponse> => {
    return fetchWithAuth('/api/infonavit/desvincular-dispositivo', {
      method: 'POST',
      body: JSON.stringify({ nss }),
    });
  },

  // 3. Consultar avisos
  consultarAvisos: async (credito: string): Promise<ApiResponse> => {
    return fetchWithAuth('/api/infonavit/consultar-avisos', {
      method: 'POST',
      body: JSON.stringify({ credito }),
    });
  },

  // 4. Estado mensual
  estadoMensual: async (credito: string, periodos: string[]): Promise<ApiResponse> => {
    return fetchWithAuth('/api/infonavit/estado-mensual', {
      method: 'POST',
      body: JSON.stringify({ credito, periodos }),
    });
  },

  // 5. Estado histórico
  estadoHistorico: async (credito: string): Promise<ApiResponse> => {
    return fetchWithAuth('/api/infonavit/estado-historico', {
      method: 'POST',
      body: JSON.stringify({ credito }),
    });
  },

  // 6. Resumen de movimientos
  resumenMovimientos: async (nss: string): Promise<ApiResponse> => {
    return fetchWithAuth('/api/infonavit/resumen-movimientos', {
      method: 'POST',
      body: JSON.stringify({ nss }),
    });
  },

  // 7. Buscar crédito
  buscarCredito: async (nss: string): Promise<ApiResponse> => {
    return fetchWithAuth('/api/infonavit/buscar-credito', {
      method: 'POST',
      body: JSON.stringify({ nss }),
    });
  },
};

// Credits API
export const creditsApi = {
  getBalance: async (): Promise<ApiResponse> => {
    return fetchWithAuth('/api/credits/balance');
  },

  getHistory: async (): Promise<ApiResponse> => {
    return fetchWithAuth('/api/credits/history');
  },
};

// Users API
export const usersApi = {
  // Obtener todos los usuarios (superadmin)
  getAllUsers: async (): Promise<ApiResponse> => {
    return fetchWithAuth('/api/users');
  },

  // Obtener mis usuarios (distribuidor)
  getMyUsers: async (): Promise<ApiResponse> => {
    return fetchWithAuth('/api/users/my-users');
  },

  // Crear usuario final
  createFinalUser: async (username: string, password: string): Promise<ApiResponse> => {
    return fetchWithAuth('/api/users/final-user', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // Crear distribuidor (superadmin)
  createDistributor: async (username: string, password: string, canCreateUsers?: boolean): Promise<ApiResponse> => {
    return fetchWithAuth('/api/users/distributor', {
      method: 'POST',
      body: JSON.stringify({ username, password, canCreateUsers }),
    });
  },

  // Crear superadmin secundario (solo master)
  createSuperadminSecondary: async (username: string, password: string): Promise<ApiResponse> => {
    return fetchWithAuth('/api/users/superadmin-secondary', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // Eliminar usuario
  deleteUser: async (userId: string): Promise<ApiResponse> => {
    return fetchWithAuth(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Asignar créditos a usuario
  assignCredits: async (userId: string, amount: number): Promise<ApiResponse> => {
    return fetchWithAuth('/api/users/assign-credits', {
      method: 'POST',
      body: JSON.stringify({ userId, amount }),
    });
  },
};

// Logs API
export const logsApi = {
  // Obtener mis consultas
  getMyQueries: async (): Promise<ApiResponse> => {
    return fetchWithAuth('/api/logs/my-queries');
  },
};

// Monitoring API
export const monitoringApi = {
  // Obtener todas las sesiones activas
  getActiveSessions: async (): Promise<ApiResponse> => {
    return fetchWithAuth('/api/monitoring/sessions');
  },

  // Obtener sesiones de un usuario específico
  getUserSessions: async (userId: string): Promise<ApiResponse> => {
    return fetchWithAuth(`/api/monitoring/sessions/user/${userId}`);
  },

  // Obtener intentos de login fallidos
  getFailedLoginAttempts: async (limit?: number): Promise<ApiResponse> => {
    const params = limit ? `?limit=${limit}` : '';
    return fetchWithAuth(`/api/monitoring/failed-logins${params}`);
  },

  // Cerrar una sesión
  closeSession: async (token: string): Promise<ApiResponse> => {
    return fetchWithAuth('/api/monitoring/sessions/close', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Cerrar todas las sesiones de un usuario
  closeAllUserSessions: async (userId: string): Promise<ApiResponse> => {
    return fetchWithAuth(`/api/monitoring/sessions/close-all/${userId}`, {
      method: 'POST',
    });
  },
};

// Helper para descargar PDF desde base64
export const downloadPDF = (base64Data: string, filename: string) => {
  try {
    if (!base64Data) {
      throw new Error('No se proporcionó datos del PDF');
    }

    // Limpiar el base64 si tiene prefijos
    let cleanBase64 = base64Data;
    if (base64Data.includes(',')) {
      cleanBase64 = base64Data.split(',')[1];
    }

    // Decodificar base64
    const binaryString = window.atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Crear blob
    const blob = new Blob([bytes], { type: 'application/pdf' });

    // Crear URL y descargar
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    console.error('Base64 data:', base64Data?.substring(0, 100));
    alert('Error al descargar el PDF. Por favor verifica la consola para más detalles.');
  }
};
