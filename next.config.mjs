/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/upbit/:path*',
        destination: 'https://api.upbit.com/:path*',
      },
    ];
  }
};

export default nextConfig;
