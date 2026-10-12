/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@oprino/tokens', '@oprino/contracts'],
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://oprino-api.onrender.com',
  },
};

export default nextConfig;
