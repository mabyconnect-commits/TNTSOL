/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fully static prerender → out/. Lets Vercel (or any static host) serve the
  // app from the repo root with no project settings. The app has no server
  // routes; every page is prerendered and all dynamic routes use
  // generateStaticParams, so static export is lossless here.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
