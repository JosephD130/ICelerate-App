/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["react-markdown", "remark-gfm"],
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // pptxgenjs ESM bundle references node: scheme URIs unused in browser.
      // Strip the node: prefix so webpack resolves them as normal modules,
      // then use fallback: false to stub them out.
      config.plugins.push({
        apply(compiler) {
          compiler.hooks.normalModuleFactory.tap("node-scheme-fix", (nmf) => {
            nmf.hooks.beforeResolve.tap("node-scheme-fix", (resolveData) => {
              if (resolveData && resolveData.request && resolveData.request.startsWith("node:")) {
                resolveData.request = resolveData.request.slice(5);
              }
            });
          });
        },
      });
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        http: false,
        stream: false,
        zlib: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
