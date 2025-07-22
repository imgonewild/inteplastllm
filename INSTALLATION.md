# 🚀 AnythingLLM Installation Guide

A comprehensive, easy-to-follow installation guide for AnythingLLM - the all-in-one AI application that enables you to chat with your documents using any LLM.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## 🎯 Prerequisites

### System Requirements

**Minimum Requirements:**
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space
- **Node.js**: Version 18 or higher
- **Network**: Internet connection for initial setup

### Required Software

1. **Node.js & npm**
   ```bash
   # Check if Node.js is installed
   node --version  # Should be 18.0.0 or higher
   npm --version
   
   # If not installed, download from: https://nodejs.org/
   ```

2. **Yarn Package Manager** (Recommended)
   ```bash
   # Install Yarn globally
   npm install -g yarn
   
   # Verify installation
   yarn --version
   ```

3. **Git**
   ```bash
   # Check Git installation
   git --version
   
   # If not installed, download from: https://git-scm.com/
   ```

---

## ⚡ Quick Start

### Option 1: Docker (Easiest - Recommended)

**For users who want to get up and running immediately:**

```bash
# Clone the repository
git clone https://github.com/Mintplex-Labs/anything-llm.git
cd anything-llm

# Run with Docker
cd docker
cp .env.example .env

# Edit the .env file with your preferences (optional)
nano .env  # or use your preferred editor

# Start AnythingLLM
docker-compose up -d
```

✅ **Access your application**: Open http://localhost:3001 in your browser

### Option 2: Desktop App (No Setup Required)

**For non-technical users:**

1. Visit [anythingllm.com/download](https://anythingllm.com/download)
2. Download for your operating system (Windows, macOS, or Linux)
3. Install and launch the application
4. Start chatting with your documents immediately!

---

## 🛠 Development Setup

### Step 1: Clone and Navigate

```bash
# Clone the repository
git clone https://github.com/Mintplex-Labs/anything-llm.git
cd anything-llm
```

### Step 2: Automated Setup

```bash
# Run the automated setup script
yarn setup
```

This command will:
- ✅ Install all dependencies for server, collector, and frontend
- ✅ Copy environment template files
- ✅ Set up the database with Prisma
- ✅ Create necessary directories and configurations

### Step 3: Configure Environment Files

After running `yarn setup`, you'll need to configure the environment files:

**Edit `server/.env.development`** (Required):
```bash
# Open the server environment file
nano server/.env.development
```

**Essential settings to configure:**
```env
# Database (SQLite is default and works out of the box)
DATABASE_CONNECTION_STRING="server/storage/anythingllm.db"

# LLM Provider (choose one)
LLM_PROVIDER=openai
OPEN_AI_KEY=your_openai_key_here

# Vector Database (LanceDB is default and requires no setup)
VECTOR_DB=lancedb

# Authentication (optional for development)
AUTH_TOKEN=your_secure_token_here

# Server Configuration
SERVER_PORT=3001
```

### Step 4: Start Development Servers

**Option A: Start all services at once**
```bash
yarn dev:all
```

**Option B: Start services individually (3 separate terminals)**
```bash
# Terminal 1: API Server
yarn dev:server

# Terminal 2: Document Collector
yarn dev:collector

# Terminal 3: Frontend
yarn dev:frontend
```

### Step 5: Access Your Application

- **Frontend**: http://localhost:3002
- **API Server**: http://localhost:3001
- **Document Collector**: http://localhost:8888

---

## 🌐 Production Deployment

### Cloud Deployment Options

AnythingLLM supports multiple deployment platforms:

| Platform | Deployment Guide |
|----------|------------------|
| **AWS** | [AWS CloudFormation Guide](./cloud-deployments/aws/cloudformation/DEPLOY.md) |
| **Google Cloud** | [GCP Deployment Guide](./cloud-deployments/gcp/deployment/DEPLOY.md) |
| **DigitalOcean** | [DigitalOcean Guide](./cloud-deployments/digitalocean/terraform/DEPLOY.md) |
| **Docker** | [Docker Guide](./docker/HOW_TO_USE_DOCKER.md) |

### Self-Hosted Production

**For bare metal or VPS deployment:**

1. **Prepare Production Environment**
   ```bash
   # Clone repository
   git clone https://github.com/Mintplex-Labs/anything-llm.git
   cd anything-llm
   
   # Install dependencies
   yarn setup
   ```

2. **Configure Production Settings**
   ```bash
   # Copy production environment templates
   cp server/.env.example server/.env.production
   cp frontend/.env.example frontend/.env.production
   
   # Edit production configurations
   nano server/.env.production
   ```

3. **Build and Deploy**
   ```bash
   # Build frontend for production
   yarn prod:frontend
   
   # Start production server
   yarn prod:server
   ```

---

## ⚙️ Configuration

### Environment Variables Reference

#### Server Configuration (`server/.env.development`)

```env
#############################################################################
# Server Configuration
#############################################################################
SERVER_PORT=3001
JWT_SECRET=your_jwt_secret_here
BCRYPT_ROUNDS=12

#############################################################################
# Database Configuration
#############################################################################
DATABASE_CONNECTION_STRING="server/storage/anythingllm.db"  # SQLite (default)
# DATABASE_CONNECTION_STRING="postgresql://user:pass@localhost:5432/anythingllm"  # PostgreSQL
# DATABASE_CONNECTION_STRING="mysql://user:pass@localhost:3306/anythingllm"  # MySQL

#############################################################################
# LLM Provider Configuration (choose one)
#############################################################################

# OpenAI
LLM_PROVIDER=openai
OPEN_AI_KEY=your_openai_key
OPEN_AI_MODEL_PREF=gpt-3.5-turbo

# Azure OpenAI
# LLM_PROVIDER=azure
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
# AZURE_OPENAI_KEY=your_azure_key

# Ollama (Local)
# LLM_PROVIDER=ollama
# OLLAMA_BASE_PATH=http://127.0.0.1:11434

# Anthropic
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=your_anthropic_key

#############################################################################
# Embedding Provider Configuration
#############################################################################
EMBEDDING_ENGINE=native  # Uses built-in embedding engine (recommended)
# EMBEDDING_ENGINE=openai
# EMBEDDING_MODEL_PREF=text-embedding-ada-002

#############################################################################
# Vector Database Configuration
#############################################################################
VECTOR_DB=lancedb  # Default, requires no additional setup

# Pinecone
# VECTOR_DB=pinecone
# PINECONE_API_KEY=your_pinecone_key
# PINECONE_INDEX=your_index_name

# Chroma
# VECTOR_DB=chroma
# CHROMA_ENDPOINT=http://localhost:8000

#############################################################################
# Authentication Configuration
#############################################################################
AUTH_TOKEN=your_secure_auth_token  # For single-user mode
# DISABLE_TELEMETRY=true  # Disable usage analytics

#############################################################################
# File Upload Configuration
#############################################################################
STORAGE_DIR=server/storage
MAX_UPLOAD_SIZE=25000000  # 25MB default

#############################################################################
# Multi-User Configuration (Docker only)
#############################################################################
# MULTI_USER_MODE=true
# JWT_SECRET=your_multi_user_jwt_secret
```

#### Frontend Configuration (`frontend/.env`)

```env
# API Configuration
VITE_API_BASE=http://localhost:3001/api

# Collector Configuration  
VITE_COLLECTOR_BASE_PATH=http://localhost:8888

# Feature Flags
VITE_MULTI_USER_MODE=false
```

### Database Options

#### SQLite (Default - Recommended for Development)
- **Pros**: No setup required, file-based, portable
- **Cons**: Single-user, not suitable for high-traffic production
- **Configuration**: Uses `server/storage/anythingllm.db`

#### PostgreSQL (Recommended for Production)
```bash
# Install PostgreSQL
# Ubuntu/Debian
sudo apt update && sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb anythingllm
sudo -u postgres createuser anythingllm_user

# Configure connection string
DATABASE_CONNECTION_STRING="postgresql://anythingllm_user:password@localhost:5432/anythingllm"
```

### LLM Provider Setup

#### OpenAI Setup
1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Create an API key
3. Add to environment: `OPEN_AI_KEY=your_key_here`

#### Local LLM with Ollama
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2

# Configure AnythingLLM
LLM_PROVIDER=ollama
OLLAMA_BASE_PATH=http://127.0.0.1:11434
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: "Port already in use"
**Solution:**
```bash
# Find and kill process using the port
sudo lsof -t -i tcp:3001 | xargs kill -9
sudo lsof -t -i tcp:3002 | xargs kill -9
sudo lsof -t -i tcp:8888 | xargs kill -9

# Or change ports in environment files
SERVER_PORT=3005  # in server/.env.development
```

#### Issue: "Database connection failed"
**Solution:**
```bash
# Reset database
yarn prisma:reset

# Check file permissions
ls -la server/storage/
chmod 755 server/storage/
```

#### Issue: "Node.js version incompatible"
**Solution:**
```bash
# Check Node.js version
node --version

# Update Node.js using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### Issue: "Yarn command not found"
**Solution:**
```bash
# Install Yarn
npm install -g yarn

# Or use npm instead of yarn
npm run setup  # instead of yarn setup
```

#### Issue: "Frontend not loading"
**Checklist:**
1. ✅ All three services running (server, collector, frontend)
2. ✅ Check browser console for errors
3. ✅ Verify API endpoints are accessible
4. ✅ Check firewall settings

#### Issue: "Upload fails"
**Solution:**
```bash
# Check storage permissions
chmod -R 755 server/storage/
chmod -R 755 collector/storage/

# Verify disk space
df -h

# Check file size limits in environment
MAX_UPLOAD_SIZE=25000000  # 25MB
```

#### Issue: "LLM responses are slow/failing"
**Solutions:**
- **OpenAI**: Check API key and quota
- **Local models**: Ensure adequate RAM (8GB+ recommended)
- **Network**: Verify internet connection for cloud providers

### Debug Mode

Enable detailed logging for troubleshooting:

```env
# Add to server/.env.development
DEBUG=true
LOG_LEVEL=debug
```

### Performance Optimization

**For better performance:**

1. **Use SSD storage** for database files
2. **Allocate sufficient RAM** (8GB+ recommended)
3. **Use PostgreSQL** instead of SQLite for production
4. **Enable caching** in production environment
5. **Use local LLMs** to reduce API latency

### Getting Help

1. **Check Logs**: Look at terminal output for error messages
2. **Community**: Join [Discord](https://discord.gg/6UyHPeGZAC) for community support
3. **Documentation**: Visit [docs.anythingllm.com](https://docs.anythingllm.com)
4. **Issues**: Report bugs on [GitHub Issues](https://github.com/Mintplex-Labs/anything-llm/issues)

---

## 📚 Additional Resources

### Learning Resources
- 📖 [Official Documentation](https://docs.anythingllm.com)
- 🎥 [Demo Video](https://youtu.be/f95rGD9trL0)
- 📋 [Document Processing Guide](./server/storage/documents/DOCUMENTS.md)
- 🔧 [Vector Database Guide](./server/storage/vector-cache/VECTOR_CACHE.md)

### Advanced Configuration
- 🐳 [Docker Deployment Guide](./docker/HOW_TO_USE_DOCKER.md)
- ☁️ [Cloud Deployment Options](https://docs.anythingllm.com)
- 🔒 [Security Best Practices](./SECURITY.md)
- 🚀 [Production Deployment](./BARE_METAL.md)

### Development
- 🛠 [Contributing Guidelines](.github/CONTRIBUTING.md)
- 🧪 [API Documentation](http://localhost:3001/api/docs) (when server is running)
- 📝 [Development Workflow](./CLAUDE.md)

---

## 🎉 Success!

If everything is working correctly, you should see:

✅ **AnythingLLM frontend** at http://localhost:3002  
✅ **API server** responding at http://localhost:3001  
✅ **Document collector** running at http://localhost:8888  

**Next Steps:**
1. Create your first workspace
2. Upload documents (PDF, DOCX, TXT, etc.)
3. Start chatting with your documents!
4. Explore advanced features like AI Agents and custom integrations

---

**Need help?** Join our community Discord or check the troubleshooting section above.

**Happy chatting!** 🚀