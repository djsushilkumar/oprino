/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@oprino/tokens', '@oprino/contracts'],
  reactStrictMode: true,
};

export default nextConfig;
