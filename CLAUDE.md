# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AnythingLLM is a full-stack AI application that enables users to turn documents into context for LLM conversations. The system supports multiple LLM providers, vector databases, and multi-user management with a containerized workspace architecture.

## Architecture

This is a monorepo with three main services:

- **frontend/** - ViteJS + React application (port 3002)
- **server/** - NodeJS Express API server with Prisma ORM
- **collector/** - NodeJS Express server for document processing and parsing

## Development Commands

### Initial Setup
```bash
yarn setup                    # Setup all .env files and dependencies
yarn setup:envs               # Copy environment template files  
yarn prisma:setup             # Generate, migrate, and seed database
```

### Development (run in separate terminals)
```bash
yarn dev:server              # Start API server (from root)
yarn dev:frontend            # Start React frontend (from root) 
yarn dev:collector           # Start document collector (from root)
yarn dev:all                 # Start all services concurrently
```

### Database Management
```bash
yarn prisma:generate         # Generate Prisma client
yarn prisma:migrate          # Run database migrations
yarn prisma:seed             # Seed database with initial data
yarn prisma:reset            # Reset database and re-run migrations
```

### Code Quality
```bash
yarn lint                    # Lint all packages (server, frontend, collector)
```

### Production
```bash
yarn prod:server             # Start production server
yarn prod:frontend           # Build frontend for production
```

## Key Architecture Patterns

### Database Layer
- Uses Prisma ORM with SQLite by default (`server/storage/anythingllm.db`)
- All models defined in `server/prisma/schema.prisma`
- Database operations in `server/models/` directory

### Document Processing Flow
1. **Collector** (`collector/`) - Processes raw files (PDF, DOCX, etc.) into structured JSON
2. **Server** (`server/utils/DocumentManager/`) - Manages document ingestion and vectorization  
3. **Vector Storage** - Stores embeddings in chosen vector database (LanceDB default)

### Workspace Architecture
- Workspaces are isolated containers for documents and conversations
- Each workspace has its own document set and chat history
- Users can have different permissions per workspace

### LLM Provider Integration
- Abstracted LLM providers in `server/utils/AiProviders/`
- Embedding providers in `server/utils/EmbeddingEngines/`
- Vector database providers in `server/utils/vectorDbProviders/`

### Agent System
- AI Agents with custom skills in `server/utils/agents/`
- Agent flows for no-code workflows in `server/utils/agentFlows/`
- MCP (Model Context Protocol) support in `server/utils/MCP/`

## Important Configuration

### Environment Files (created by `yarn setup:envs`)
- `server/.env.development` - Server configuration (required)
- `frontend/.env` - Frontend environment variables
- `collector/.env` - Document collector settings
- `docker/.env` - Docker environment variables

### Storage Locations
- `server/storage/documents/` - Processed document metadata
- `server/storage/vector-cache/` - Vector embedding cache
- `server/storage/lancedb/` - Default vector database files
- `server/storage/models/` - Downloaded AI models

## Testing

Check individual package.json files for test commands. The project uses different testing approaches per service but no global test runner is configured at the root level.

## Key Development Notes

- Frontend runs on port 3002, server typically on 3001, collector on 8888
- Document processing is asynchronous - files go through collector then server
- Vector embeddings are cached to avoid recomputation
- Multi-user features only available in Docker deployments
- The system supports hot-reloading in development mode