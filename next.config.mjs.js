/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Allows image uploads up to 10MB
    },
  },
};

export default nextConfig;