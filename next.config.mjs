// --- BLOCK next.config.mjs OPEN ---
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Adjust this higher if you need more than 10MB
    },
  },
};

export default nextConfig;
// --- BLOCK next.config.mjs CLOSE ---