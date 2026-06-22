/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint's native resolver (unrs-resolver) can't run its postinstall in this
  // environment; skip lint during build (run `npm run lint` separately if needed).
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
