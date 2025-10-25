/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Logging configuration
  env: {
    LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Performance monitoring
  experimental: {
    instrumentationHook: true,
  },

  // Webpack configuration for logging
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add performance monitoring in production
    if (!dev && !isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          '__BUILD_ID__': JSON.stringify(buildId),
          '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
        })
      );
    }

    return config;
  },

  // Headers for better logging
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Request-ID',
            value: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
