import Axios from 'axios';

// Use local proxy server to bypass CORS restrictions
const PROXY_BASE_URL = 'http://localhost:3002/api/invidious';

const invidiousAxios = Axios.create({
    baseURL: PROXY_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 second timeout
});

// Basic error logging interceptor
invidiousAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Invidious API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
        });
        return Promise.reject(error);
    }
);

export default invidiousAxios;