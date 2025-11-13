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
      // Exclude packages with native binaries from webpack bundling on the server
      // They will be loaded directly from node_modules at runtime
      config.externals = [
        ...config.externals,
        'playwright-core',
        'magnitude-core',
        '@boundaryml/baml',
        /@boundaryml\/baml-.*/,  // Matches all platform-specific baml packages
      ];
    }
    return config;
  },
}

export default nextConfig
