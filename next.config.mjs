/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude playwright-core from webpack bundling on the server
      // It will be loaded directly from node_modules at runtime
      config.externals = [...config.externals, 'playwright-core'];
    }
    return config;
  },
}

export default nextConfig
