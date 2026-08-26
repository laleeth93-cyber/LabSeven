/** @type {import('next').NextConfig} */
const nextConfig = {
  // This prevents Vercel's bundler from breaking the Chromium binary paths
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
  
  // NOTE: If you are using the newest Next.js 15, uncomment the line below 
  // and delete the 'experimental' block above.
  // serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
};

export default nextConfig;