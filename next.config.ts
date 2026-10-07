import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Memes now live in the /rate feed, and the old members-only /vault became
  // members-only memes there.
  async redirects() {
    return [
      { source: "/memes", destination: "/rate?tab=memes", permanent: false },
      { source: "/vault", destination: "/rate?tab=memes", permanent: false },
    ];
  },
  experimental: {
    serverActions: {
      // Photos are resized in the browser to well under 3 MB (the photos
      // bucket limit); leave room for multipart overhead. Vercel caps request
      // bodies at 4.5 MB.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
