import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Perhatikan typo: pastikan NODE_ENV, bukan NODE_NODE
  disable: process.env.NODE_ENV === 'development'
})

export default withPWA({
  /* config options here */
  reactCompiler: true,
  webpack: (config, {}) => {
    return config
  },
  turbopack: {}
})
