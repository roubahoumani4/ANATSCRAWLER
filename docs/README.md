# ANAT Security - Web Application Documentation

## Overview
This project is a full-stack web application for ANAT Security, focusing on credential search and user management. It uses a React frontend with a Node.js/Express backend, connected to MongoDB. The application follows a modern architecture with component-based UI design using Shadcn UI components and implements features like authentication, dark/light theme switching, and multilingual support.

## Deployment History

### Recent Deployments
- June 19, 2025 14:35: Redeployed application
- June 19, 2025 14:30: Tested SSH connection with detailed debugging
- June 19, 2025 14:20: Used explicit ituu username
- June 19, 2025 13:45: General redeployment attempt

## Deployment Configuration
The application is deployed across multiple VMs with the following architecture:
- Application Server: 192.168.1.105 (Main application VM)
- Database Server: 192.168.1.110 (Hosts MongoDB, Redis, and Elasticsearch)
- Reverse Proxy: Nginx on a separate VM that handles HTTPS and proxies requests to the application server

### Development Setup
To run the application in development mode:
```bash
./scripts/dev.sh
```
This will:
- Set up development environment variables
- Install dependencies
- Start the development server with hot reloading

### Production Deployment
To deploy to production:
```bash
./scripts/prod.sh
```
This script will:
- SSH into the application VM (192.168.1.105)
- Pull latest changes from GitHub
- Set up production environment variables
- Build the application
- Deploy using PM2 in cluster mode
- Configure logging and monitoring

### Infrastructure Details
- Application Server (192.168.1.105):
  - Runs the Node.js application
  - Uses PM2 for process management
  - Configured for maximum performance and reliability
- Database Server (192.168.1.110):
  - MongoDB: Port 27017
  - Redis: Port 6379
  - Elasticsearch: Port 9200
- Nginx Reverse Proxy:
  - Handles SSL/TLS termination
  - Proxies requests to the application server
  - Manages HTTPS certificates

## System Architecture
The application follows a client-server architecture with the following core components:

1. **Frontend**: React-based single-page application (SPA) using TypeScript
   - Built with modern React patterns and hooks
   - Uses Wouter for routing (lightweight alternative to React Router)
   - Implements dark/light theme support and internationalization (English, French, Spanish)
   - Uses Framer Motion for animations and transitions
   - Utilizes TanStack React Query for data fetching and state management

2. **Backend**: Express.js server running on Node.js
   - RESTful API endpoints for data operations
   - Authentication using JWT tokens
   - Server-side rendering support during development with Vite
   - API route logging middleware

3. **Database**: MongoDB
   - Schema defined in `shared/schema.ts`
   - Tables for users, search history, search results, and user preferences
   - Connection handled via environment variables

4. **Build/Development**: Vite for development and bundling
   - Hot module reloading during development
   - Optimized production builds
   - TypeScript support with ESM modules

## Key Components

### Frontend Components

1. **UI Component Library**
   - Uses Shadcn UI, a collection of accessible and customizable UI components
   - Implements the "New York" style variant with CSS variables for theming
   - Components include buttons, cards, dialogs, forms, and more

2. **Context Providers**
   - AuthContext: Manages user authentication state and login/logout operations
   - ThemeContext: Handles theme switching between dark and light modes
   - LanguageContext: Provides internationalization support (English, French, Spanish)

3. **Pages**
   - Dashboard: Main application view for search functionality
   - Users: User management interface
   - Settings: Application configuration for general settings and preferences
   - Login: Authentication interface

4. **Layout Components**
   - Header, Footer, and navigation elements
   - Responsive design with mobile support

### Backend Components

1. **API Routes**
   - Authentication endpoints for login, logout, and registration
   - User management for creating and updating user information
   - Search functionality for querying credential data
   - Settings management for user preferences

2. **Middleware**
   - Authentication middleware to protect routes
   - Logging middleware for API request tracking
   - Rate limiting and security measures (helmet, CORS, XSS protection)

3. **Storage Layer**
   - Database interactions abstracted through a storage interface
   - Using MongoDB for all data storage

## Data Flow

1. **Authentication Flow**
   - User submits credentials via login form
   - Server validates credentials and issues JWT token
   - Token stored in client (localStorage) and included in subsequent requests
   - Protected routes check token validity before processing requests

2. **Search Flow**
   - User submits search query from dashboard
   - Query sent to backend API endpoint
   - Results retrieved from database or external services
   - Results displayed to user with pagination and filtering options
   - Search history stored in database

3. **User Management Flow**
   - Admin users can view, create, and edit user accounts
   - User data validated on client and server
   - Password hashing using bcrypt for security

## External Dependencies

1. **UI and Styling**
   - TailwindCSS for utility-first styling
   - Radix UI for accessible primitives

## CI/CD and Automated Deployment

### GitHub Actions Workflow
The application uses GitHub Actions for automated deployment. When code is pushed to the `main` branch, it triggers the following deployment process:

1. **Build Process***:
   - Checkout code
   - Install Node.js and dependencies
   - Build the application
   
2. **Deployment Process**:
   - Creates a new timestamped deployment directory on the VM
   - Copies the built application to the new directory
   - Sets up environment configuration
   - Updates PM2 process manager
   - Implements zero-downtime deployment using symlinks
   - Cleans up old deployments (keeps last 5)

### Required Secrets
Set up the following secrets in your GitHub repository:
- `SSH_PRIVATE_KEY`: SSH private key for VM access
- `JWT_SECRET`: Secret for JWT token generation
- `COOKIE_SECRET`: Secret for cookie signing

### Zero-Downtime Deployment
The deployment process uses a rolling update strategy:
1. New code is deployed to a timestamped directory
2. PM2 starts the new version
3. Symlink is updated to point to the new version
4. Old deployments are cleaned up automatically

### PM2 Configuration
The application runs in PM2 with the following settings:
- Cluster mode with maximum instances
- Memory limit of 1GB per instance
- Automatic restarts on failures
- Structured logging with timestamps
- Error and output logs in the `logs` directory

### Infrastructure

The application is deployed across multiple VMs in a secure configuration:

- **Nginx Server (Gateway)**:
  - Handles HTTPS termination
  - Reverse proxies to application server
  - Manages SSL/TLS certificates
  - Serves static assets
  - Load balancing and request routing

- **Application Server**:
  - SSH Access: 46.165.254.175:50103
  - Internal Network: 192.168.1.105
  - Runs Node.js application via PM2
  - Cluster mode for high availability
  - Zero-downtime deployments
  - Accessible only through Nginx reverse proxy

- **Database Server (192.168.1.110)**:
  - MongoDB (27017)
  - Redis (6379)
  - Elasticsearch (9200)
  - Internal network access only
  - Not exposed to public internet
