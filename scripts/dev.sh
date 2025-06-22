#!/bin/bash
set -e

# Development environment setup and run script
export NODE_ENV=development
export PORT=5000
export ELASTICSEARCH_URL=http://192.168.1.110:9200
export MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
export REDIS_URL=redis://192.168.1.110:6379
export VITE_API_URL=http://localhost:5000/api

# Install dependencies
npm ci

# Start development server with hot reloading
npm run dev
