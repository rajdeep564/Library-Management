const raw = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/";
export const Server_URL = raw.endsWith("/") ? raw : `${raw}/`;
