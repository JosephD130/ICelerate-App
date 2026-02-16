/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["react-markdown", "remark-gfm"],
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
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
