import axios from 'axios';

//const apiClient = axios.create({
 // baseURL: `${window.location.protocol}////${window.location.hostname}:8000`,
  //headers: {
   // 'Content-Type': 'application/json',
 //},
//});

//  const apiClient = axios.create({
//     baseURL: 'https://peleteria-jeylor-app.onrender.com',     headers: {
//     'Content-Type': 'application/json',
//      },
//       });

const base = process.env.REACT_APP_API_URL || "http://localhost:8000";
export const apiClient = axios.create({
  baseURL: base,
  headers: { "Content-Type": "application/json" },
});


// Interceptor para añadir el token de autenticación a las solicitudes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- API para Panel del Operador ---

export const getPanelOperadorPendientes = () => {
  return apiClient.get('/panel_operador/pendientes');
};

export const getPanelOperadorProductividad = () => {
  return apiClient.get('/panel_operador/productividad');
};

export const getPanelOperadorHistorial = () => {
  return apiClient.get('/panel_operador/historial');
};

export default apiClient;
