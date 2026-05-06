import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,

  // Backend API serverga ulanishga ruxsat
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
    const backendBase = apiUrl.replace('/api', '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
};

export default config;
