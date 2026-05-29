/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION
const nextConfig = {
  ...(isVercel ? {} : { output: 'export' }),
  trailingSlash: !isVercel,
}
module.exports = nextConfig
