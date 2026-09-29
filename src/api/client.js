import axios from 'axios';

const client = axios.create({
  // Use the env variable if provided, otherwise default to the Render backend
  baseURL: import.meta.env.VITE_API_URL || 'https://pjl-backend.onrender.com/api'
});

export default client;
