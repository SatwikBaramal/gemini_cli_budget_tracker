import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Optimize package imports to reduce bundle size
  experimental: {
    // @ts-expect-error - allowedDevOrigins not yet in types
    allowedDevOrigins: [
      'http://10.174.123.201:3000', // your LAN or local dev IP
      'http://localhost:3000',      // local dev server
    ],
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-accordion', '@radix-ui/react-dialog'],
  },
  
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
