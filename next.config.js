/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /package\.json$/,
      loader: 'json-loader',
      type: 'javascript/auto'
    })
    return config
  }
}

module.exports = nextConfig 