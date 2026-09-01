import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure trailing slashes are not used
  trailingSlash: false,
  // Ensure SSG routes are properly generated
  output: undefined,
  // Note: output: 'export' is not compatible with useSearchParams
  // The search page uses client-side search instead
};

export default nextConfig;
