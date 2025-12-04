/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Exclude playwright-core from bundling - loaded from node_modules at runtime
  serverExternalPackages: ['playwright-core'],
  turbopack: {},
}

export default nextConfig
