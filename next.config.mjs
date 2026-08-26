/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium'
    ]
  },

  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push('@sparticuz/chromium');
    return config;
  }
};

export default nextConfig;