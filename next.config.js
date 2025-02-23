/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.module.rules.push({
            test: /package\.json$/,
            loader: 'json-loader',
            type: 'javascript/auto',
        })
        return config
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
}

module.exports = nextConfig, {
    experimental: {
      missingSuspenseWithCSRBailout: false,
    },
  }
