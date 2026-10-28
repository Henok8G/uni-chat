import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@prisma/client",
      "date-fns",
      "clsx",
      "tailwind-merge",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "fonts.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/app/profile",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/app/profile/:path+",
        destination: "/profile/:path+",
        permanent: true,
      },
      {
        source: "/app/settings",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/app/settings/:path+",
        destination: "/settings/:path+",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
