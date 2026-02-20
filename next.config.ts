import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Uncomment this line for Android build
  images: {
    unoptimized: true
  }
};

export default nextConfig;
