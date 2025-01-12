import { NextConfig } from 'next';

// URL backendu - użyj HTTPS, jeśli Twój backend działa na HTTPS
const API_BASE_URL = 'https://localhost:8443';

// Konfiguracja Next.js
const nextConfig: NextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [
            {
                source: '/api/:path*', // Wszystkie żądania zaczynające się od /api
                destination: `${API_BASE_URL}/:path*`, // Przekierowanie do backendu
            },
        ];
    },
};

export default nextConfig;
