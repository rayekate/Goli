import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['bcryptjs'],
  poweredByHeader: false,
};

export default nextConfig;
