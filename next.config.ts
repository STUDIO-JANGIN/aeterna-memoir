import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 1) Keep an explicit empty object to avoid Turbopack initialization errors.
  turbopack: {}, 

  allowedDevOrigins: ["172.20.10.2", "172.20.10.2:3000", "http://172.20.10.2:3000", "localhost:3000", "http://localhost:3000"],
  
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  webpack: (config, { dir }) => {
    const projectRoot = dir || path.resolve(__dirname);
    config.context = projectRoot;
    config.resolve = config.resolve || {};
    config.resolve.modules = [
      path.join(projectRoot, "node_modules"),
      ...(Array.isArray(config.resolve.modules) ? config.resolve.modules : []),
    ];
    return config;
  },
};

export default nextConfig;