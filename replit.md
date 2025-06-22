# ANAT Security - Web Application

## Overview
This project is a full-stack web application for ANAT Security, focusing on credential search and user management. It uses a React frontend with a Node.js/Express backend, connected to MongoDB. The application follows a modern architecture with component-based UI design using Shadcn UI components and implements features like authentication, dark/light theme switching, and multilingual s.

## User Preferences
Preferred communication style: Simple, everyday language.

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
   - Framer Motion for animations
   - FontAwesome for icons

2. **Data Management**
   - TanStack React Query for server state management
   - Zod for schema validation
   - MongoDB client for database operations

3. **Authentication**
   - JWT for token-based authentication
   - bcrypt for password hashing

4. **Development Tools**
   - TypeScript for type safety
   - Vite for development and building
   - ESBuild for server bundling

## Deployment Strategy

The application is configured for deployment on Replit with the following approach:

1. **Development Mode**
   - `npm run dev` starts the development server
   - Vite provides hot module reloading
   - Backend and frontend run from the same process

2. **Production Build**
   - Frontend built with Vite (`vite build`)
   - Backend bundled with ESBuild
   - Static assets served from `/dist/public`

3. **Database and Search**
   - MongoDB used as the main database
   - Elasticsearch for full-text search capabilities
   - Native MongoDB driver for direct database operations

4. **Environment Configuration**
   - Separate development and production settings
   - Environment variables for sensitive configuration
   - Replit-specific optimizations for performance

The deployment target is set to "autoscale" in the `.replit` configuration, allowing the application to scale automatically based on demand.