module.exports = {
  apps: [
    {
      name: 'anatscrawler',
      script: 'index.js',
      env: {
        NODE_ENV: 'production',
        PORT: '5000',
        ELASTICSEARCH_URL: 'http://192.168.1.110:9200',
        MONGODB_URL: 'mongodb://192.168.1.110:27017/anat_security',
        REDIS_URL: 'redis://192.168.1.110:6379',
        JWT_SECRET: process.env.JWT_SECRET,
        COOKIE_SECRET: process.env.COOKIE_SECRET,
        MISP_URL: 'https://hera.anatsecurity.fr/attributes/restSearch',
        MISP_API_KEY: 'A9ODR6gV6aYz55sPpwK8vzHbdq2bgGHzzsW4kO5D',
        MISP_VERIFY_TLS: process.env.MISP_VERIFY_TLS,
        MISP_TIMEOUT_MS: process.env.MISP_TIMEOUT_MS
      }
    }
  ]
}
