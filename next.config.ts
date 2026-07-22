import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // phones on the local network join through the machine's LAN IP in dev;
  // without this the dev server rejects their requests as cross-origin
  allowedDevOrigins: ["192.168.1.84", "192.168.1.*", "*.local"],
  images: {
    // avatar art carries a cache-busting version query (see Mascot ART_VERSION)
    localPatterns: [
      { pathname: "/avatars/**", search: "?v=4" },
      { pathname: "/**", search: "" },
    ],
  },
};

export default nextConfig;
