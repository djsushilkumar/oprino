const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://oprino-api.onrender.com';

const isProductionBuild =
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL_ENV === 'production';

if (isProductionBuild) {
  try {
    const parsed = new URL(apiUrl);
    if (parsed.protocol !== 'https:') {
      throw new Error(`Production web build requires HTTPS API URL, received "${parsed.protocol}" in "${apiUrl}"`);
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '10.0.2.2' ||
      host.endsWith('.localhost') ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      throw new Error(`Production web build cannot target local loopback or private host "${host}" in "${apiUrl}"`);
    }
  } catch (err) {
    throw new Error(`Security gate violation: Invalid NEXT_PUBLIC_API_URL for production web build: ${err.message}`);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@oprino/tokens', '@oprino/contracts'],
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
