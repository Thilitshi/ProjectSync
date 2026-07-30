// frontend/src/config.js
const API_URL = process.env.REACT_APP_API_URL || '${API_URL}';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || '${SOCKET_URL}';

export { API_URL, SOCKET_URL };