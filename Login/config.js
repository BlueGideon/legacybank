// Detecta si estás en desarrollo local o en producción
const isLocal = window.location.hostname === "127.0.0.1" || 
                window.location.hostname === "localhost";

// ✅ CAMBIA ESTA IP por la tuya si es diferente
export const API_URL = isLocal
    ? "http://192.168.40.34:3000" // Tu backend en casa
    : "http://192.168.40.34:3000"; // También mientras uses datos
