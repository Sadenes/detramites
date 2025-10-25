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
  // Force cache bust - updated 2025-10-25
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
}

export default nextConfig
