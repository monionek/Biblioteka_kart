import axios from 'axios';
import https from 'https';

// Tworzymy instancję Axiosa z ignorowaniem certyfikatu SSL
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Ignoruj błędy certyfikatu
    }),
    baseURL: 'https://localhost:8443',
});

export default axiosInstance;