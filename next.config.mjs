// import withSerwistInit from "@serwist/next";

// const withSerwist = withSerwistInit({
//   swSrc: "app/sw.js",
//   swDest: "public/sw.js",
// });

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
};

// export default withSerwist(nextConfig);
export default nextConfig;