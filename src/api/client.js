import axios from 'axios';

const PROD_URL = 'https://propcheck-be.onrender.com/api';
const LOCAL_URL = 'http://localhost:8080/api';

let baseURL = PROD_URL;

// Only in local development mode, allow overriding via localStorage
if (import.meta.env.DEV) {
  const preferredApi = localStorage.getItem('preferred_api');
  baseURL = preferredApi === 'local' ? LOCAL_URL : PROD_URL;
}

const client = axios.create({
  baseURL
});

export default client;
