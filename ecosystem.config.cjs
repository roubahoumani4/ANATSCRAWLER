module.exports = {
  apps: [
    {
      name: 'anatscrawler',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: '5000',
        ELASTICSEARCH_URL: 'http://192.168.1.110:9200',
        MONGODB_URL: 'mongodb://192.168.1.110:27017/anat_security',
        REDIS_URL: 'redis://192.168.1.110:6379',
        JWT_SECRET: process.env.JWT_SECRET,
        COOKIE_SECRET: process.env.COOKIE_SECRET
      }
    }
  ]
}
