# Skill Swap Platform

## Overview

This is a full-stack skill exchange platform built with React and Express.js. The application allows users to connect with others to trade skills - teaching what they know while learning what they need. Users can create profiles, list their offered and wanted skills, send swap requests, and rate their experiences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with custom dark theme
- **Build Tool**: Vite with TypeScript support

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **API Structure**: RESTful endpoints with proper error handling

### Key Design Decisions
1. **Monorepo Structure**: Uses a shared folder for database schemas and types between client and server
2. **Type Safety**: Full TypeScript implementation with Zod validation schemas
3. **Authentication**: Integrates with Replit's auth system for seamless user management
4. **Database**: Uses Drizzle ORM for type-safe database operations and easy migrations
5. **UI Design**: Dark theme with teal accent colors, responsive design with mobile-first approach

## Key Components

### Database Schema
- **users**: User profiles with authentication integration
- **skills**: Skill categories and definitions
- **userSkillsOffered/userSkillsWanted**: Many-to-many relationships for user skills
- **swapRequests**: Skill exchange requests between users
- **ratings**: User feedback and rating system
- **sessions**: Session storage for authentication
- **platformMessages**: Admin messaging system

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication with PostgreSQL storage
- User profile management with public/private visibility options
- Admin role system for platform management

### Core Features
- **User Discovery**: Search and browse users by skills and availability
- **Skill Management**: Add/remove offered and wanted skills
- **Swap Requests**: Send, accept, reject, and track skill exchange requests
- **Rating System**: Rate and review completed exchanges
- **Admin Dashboard**: Platform management and user oversight

## Data Flow

1. **Authentication**: Users authenticate via Replit Auth, sessions stored in PostgreSQL
2. **User Management**: Profile data synced between Replit and local database
3. **Skill Matching**: Users search for others based on complementary skills
4. **Request Lifecycle**: Swap requests flow through pending → accepted → completed states
5. **Feedback Loop**: Completed exchanges generate ratings and reviews

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management and caching
- **express**: Web framework for API routes
- **passport**: Authentication middleware for Replit Auth

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight React routing

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for server development

## Deployment Strategy

### Development
- Uses Vite dev server for frontend with hot reload
- Express server runs with tsx for TypeScript support
- Database migrations handled via Drizzle Kit
- Replit-specific plugins for development environment

### Production
- Frontend built with Vite and served as static files
- Backend bundled with esbuild for Node.js execution
- Database connection via Neon serverless PostgreSQL
- Environment variables for database and auth configuration

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect issuer endpoint

The application follows a traditional client-server architecture with modern tooling, emphasizing type safety, developer experience, and scalability through serverless database connections.