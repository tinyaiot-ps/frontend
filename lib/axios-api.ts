import axios from 'axios';
// import { redirect } from 'next/navigation'

// Create an Axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
});

// Add a response interceptor
api.interceptors.response.use(
  (response) => response, // Return the response if it's successful
  (error) => {
    // TODO: forwarding all unauthorized requests to the login page could lead to problems in the future if different user roles have different rights
    if (error.response && error.response.status === 401) {
      // TODO: why cant I use the redirect from next/navigation for this?
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;