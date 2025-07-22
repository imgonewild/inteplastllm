# 👨‍💻 AnythingLLM Developer Guide

A comprehensive guide for developers working with AnythingLLM - covering development workflows, architecture patterns, and best practices.

## 📋 Table of Contents

- [Development Environment](#development-environment)
- [Architecture Overview](#architecture-overview) 
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Database Management](#database-management)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Testing](#testing)
- [Contributing](#contributing)

---

## 🛠 Development Environment

### Prerequisites
- **Node.js**: 18.0.0 or higher
- **Yarn**: Latest version (recommended over npm)
- **Git**: For version control
- **IDE**: VS Code recommended with extensions

### Quick Setup
```bash
# Clone and setup
git clone https://github.com/Mintplex-Labs/anything-llm.git
cd anything-llm
yarn setup

# Start development servers
yarn dev:all  # or start individually
```

### Development Scripts Reference

#### Root Level Commands
```bash
# Setup & Installation
yarn setup                    # Complete project setup
yarn setup:envs              # Copy environment templates

# Development Servers
yarn dev:server              # Start API server (port 3001)
yarn dev:frontend            # Start React frontend (port 3002) 
yarn dev:collector           # Start document collector (port 8888)
yarn dev:all                 # Start all services concurrently

# Production Builds
yarn prod:server             # Production server
yarn prod:frontend           # Build frontend for production

# Database Operations
yarn prisma:generate         # Generate Prisma client
yarn prisma:migrate          # Run database migrations
yarn prisma:seed             # Seed database with initial data
yarn prisma:setup            # Complete database setup
yarn prisma:reset            # Reset database and re-migrate

# Code Quality
yarn lint                    # Lint all packages (server, frontend, collector)
```

#### Service-Specific Commands

**Server (`server/`):**
```bash
cd server
yarn dev                     # Development server with hot reload
yarn start                  # Production server
yarn lint                   # ESLint server code
yarn prisma studio          # Open Prisma Studio GUI
```

**Frontend (`frontend/`):**
```bash
cd frontend  
yarn dev                     # Development server with hot reload
yarn build                  # Production build
yarn preview                # Preview production build
yarn lint                   # ESLint frontend code
```

**Collector (`collector/`):**
```bash
cd collector
yarn dev                     # Development server with hot reload
yarn start                  # Production server
yarn lint                   # ESLint collector code
```

---

## 🏗 Architecture Overview

### Monorepo Structure
```
anything-llm/
├── server/              # NodeJS Express API server
├── frontend/            # ViteJS + React application  
├── collector/           # Document processing server
├── docker/              # Docker configurations
├── cloud-deployments/  # Cloud deployment templates
├── browser-extension/   # Chrome extension
└── docs/               # Documentation
```

### Service Communication
```
Frontend (3002) ←→ Server API (3001) ←→ Collector (8888)
                      ↓
                 Database (SQLite/PostgreSQL)
                      ↓  
                Vector Database (LanceDB/Pinecone/etc)
```

### Core Components

#### Server Architecture (`server/`)
```
server/
├── endpoints/           # API route handlers
├── models/             # Database models (Prisma)
├── utils/              # Core business logic
│   ├── AiProviders/    # LLM integrations  
│   ├── EmbeddingEngines/  # Embedding providers
│   ├── vectorDbProviders/ # Vector database integrations
│   ├── agents/         # AI agent system
│   └── chats/          # Chat handling logic
├── middleware/         # Express middleware
├── prisma/            # Database schema & migrations
└── storage/           # File storage & cache
```

#### Frontend Architecture (`frontend/`)  
```
frontend/src/
├── components/         # Reusable UI components
├── pages/             # Route-level components
├── models/            # API communication layer
├── utils/             # Helper functions
├── hooks/             # React hooks
├── media/             # Static assets
└── locales/           # Internationalization
```

#### Document Processing (`collector/`)
```
collector/
├── processSingleFile/  # File type processors
├── utils/             # Processing utilities
├── extensions/        # External integrations
└── storage/           # Temporary file storage
```

---

## 🔄 Development Workflow

### Daily Development

1. **Start Development Environment**
   ```bash
   # Terminal 1: API Server
   yarn dev:server
   
   # Terminal 2: Frontend  
   yarn dev:frontend
   
   # Terminal 3: Collector
   yarn dev:collector
   
   # Or use concurrently
   yarn dev:all
   ```

2. **Access Applications**
   - Frontend: http://localhost:3002
   - API: http://localhost:3001  
   - API Docs: http://localhost:3001/api/docs
   - Collector: http://localhost:8888

3. **Development Features**
   - ✅ Hot reload on all services
   - ✅ Automatic browser refresh
   - ✅ Real-time error reporting
   - ✅ Source maps for debugging

### Feature Development Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Database Changes (if needed)**
   ```bash
   # Edit schema
   nano server/prisma/schema.prisma
   
   # Generate migration
   yarn prisma:migrate
   
   # Generate client
   yarn prisma:generate
   ```

3. **API Development**
   ```bash
   # Add endpoint
   touch server/endpoints/yourFeature.js
   
   # Add model (if needed)
   touch server/models/yourModel.js
   
   # Add utilities
   touch server/utils/yourUtility.js
   ```

4. **Frontend Development**
   ```bash
   # Add component
   touch frontend/src/components/YourComponent/index.jsx
   
   # Add page (if needed)  
   touch frontend/src/pages/YourPage/index.jsx
   
   # Add API model
   touch frontend/src/models/yourModel.js
   ```

5. **Testing & Validation**
   ```bash
   # Lint code
   yarn lint
   
   # Test manually in browser
   # Add unit tests (recommended)
   ```

6. **Commit & PR**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

---

## 📝 Code Standards

### JavaScript/Node.js Standards

**File Naming:**
- Use `camelCase` for files and variables
- Use `PascalCase` for React components  
- Use `kebab-case` for directories

**Code Style:**
```javascript
// Use modern ES6+ syntax
const myFunction = async (param) => {
  try {
    const result = await someAsyncOperation(param);
    return result;
  } catch (error) {
    console.error('Error in myFunction:', error);
    throw error;
  }
};

// Prefer destructuring
const { userId, workspaceId } = request.body;

// Use proper error handling
if (!userId) {
  return response.status(400).json({ 
    error: 'User ID is required' 
  });
}
```

### React/Frontend Standards

**Component Structure:**
```jsx
// components/MyComponent/index.jsx
import React, { useState, useEffect } from 'react';
import './MyComponent.css';

export default function MyComponent({ prop1, prop2, onAction }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Side effects here
  }, []);

  const handleClick = () => {
    onAction('data');
  };

  return (
    <div className="my-component">
      <h2>{prop1}</h2>
      <button onClick={handleClick}>
        {prop2}
      </button>
    </div>
  );
}
```

**API Integration:**
```javascript
// models/workspace.js  
import { API_BASE } from '../utils/constants';

const Workspace = {
  create: async (data) => {
    const response = await fetch(`${API_BASE}/workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create workspace');
    }
    
    return await response.json();
  }
};

export default Workspace;
```

### Database Standards

**Prisma Schema Conventions:**
```prisma
// Use singular model names
model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations use descriptive names
  workspaces  UserWorkspace[]
  
  @@map("users") // Table name plural
}
```

**Database Queries:**
```javascript
// Use transactions for multi-table operations
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const workspace = await tx.workspace.create({ 
    data: { ...workspaceData, userId: user.id }
  });
  return { user, workspace };
});
```

---

## 🗃 Database Management

### Prisma Workflow

**Schema Changes:**
```bash
# 1. Edit schema file
nano server/prisma/schema.prisma

# 2. Create migration
cd server && npx prisma migrate dev --name your_migration_name

# 3. Generate client  
npx prisma generate

# 4. Update seed file (if needed)
nano prisma/seed.js && npx prisma db seed
```

**Common Operations:**
```bash
# View database in GUI
cd server && npx prisma studio

# Reset database (development only)
yarn prisma:reset

# Check migration status
cd server && npx prisma migrate status

# Deploy to production
cd server && npx prisma migrate deploy
```

### Database Providers

**SQLite (Development):**
```env
DATABASE_CONNECTION_STRING="file:./storage/anythingllm.db"
```

**PostgreSQL (Production):**
```env  
DATABASE_CONNECTION_STRING="postgresql://user:pass@localhost:5432/anythingllm"
```

### Schema Design Patterns

**User Management:**
```prisma
model User {
  id        Int      @id @default(autoincrement())  
  username  String   @unique
  password  String
  role      String   @default("user")
  suspended Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Workspace System:**
```prisma
model Workspace {
  id           Int      @id @default(autoincrement())
  name         String
  slug         String   @unique
  description  String?
  vectorTag    String?  @unique
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  documents    Document[]
  chats        WorkspaceChats[]
}
```

---

## 🔌 API Development

### Endpoint Structure

**File Organization:**
```
server/endpoints/
├── workspace.js         # Workspace CRUD
├── document.js          # Document management  
├── chat.js             # Chat handling
├── admin.js            # Admin functions
└── api/                # API versioned routes
    ├── workspace/      
    └── auth/
```

**Standard Endpoint Pattern:**
```javascript
// server/endpoints/example.js
const { validatedRequest } = require('../utils/middleware/validatedRequest');
const { SystemSettings } = require('../models/systemSettings');

function exampleEndpoints(app) {
  // GET endpoint
  app.get('/api/example/:id', [validatedRequest], async (request, response) => {
    try {
      const { id } = request.params;
      const result = await ExampleModel.get({ id });
      
      if (!result) {
        return response.status(404).json({ 
          error: 'Example not found' 
        });
      }
      
      response.status(200).json({ example: result });
    } catch (error) {
      console.error('GET /api/example/:id error:', error);
      response.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  });

  // POST endpoint with validation
  app.post('/api/example', [validatedRequest], async (request, response) => {
    try {
      const { name, description } = request.body;
      
      if (!name) {
        return response.status(400).json({
          error: 'Name is required'
        });
      }
      
      const example = await ExampleModel.create({
        name, 
        description,
        userId: request.user?.id
      });
      
      response.status(201).json({ 
        example,
        message: 'Example created successfully'  
      });
    } catch (error) {
      console.error('POST /api/example error:', error);
      response.status(500).json({ 
        error: 'Failed to create example' 
      });
    }
  });
}

module.exports = { exampleEndpoints };
```

### Authentication Middleware

**Protected Routes:**
```javascript
const { multiUserMode } = require('../utils/http');
const { validApiKey } = require('../utils/middleware/validApiKey');

// Single-user mode
app.post('/api/protected', [validatedRequest], handler);

// Multi-user mode  
app.post('/api/protected', [
  multiUserMode(response),
  validatedRequest
], handler);

// API key required
app.post('/api/external', [validApiKey], handler);
```

### Error Handling Patterns

```javascript
// Consistent error responses
const handleError = (error, response, operation = 'operation') => {
  console.error(`${operation} error:`, error);
  
  if (error.code === 'P2002') { // Prisma unique constraint
    return response.status(409).json({
      error: 'Resource already exists'
    });
  }
  
  response.status(500).json({
    error: `Failed to complete ${operation}`
  });
};

// Usage
try {
  const result = await someOperation();
  response.json({ result });
} catch (error) {
  return handleError(error, response, 'create user');
}
```

---

## 🎨 Frontend Development

### Component Development

**Directory Structure:**
```
components/YourComponent/
├── index.jsx           # Main component
├── YourComponent.css   # Styles
└── README.md          # Component documentation
```

**Component Template:**
```jsx
import React, { useState, useEffect } from 'react';
import './YourComponent.css';

export default function YourComponent({ 
  prop1, 
  prop2 = 'default value',
  onAction = () => {} 
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [prop1]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // API call
      const response = await fetch(`/api/data/${prop1}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    onAction(data);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="your-component">
      <h2>{prop2}</h2>
      {data && (
        <div className="data-display">
          <p>{data.description}</p>
          <button onClick={handleAction}>
            Perform Action
          </button>
        </div>
      )}
    </div>
  );
}
```

### State Management

**Local State (useState):**
```jsx
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

**Context for Global State:**
```jsx
// contexts/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (credentials) => {
    // Login logic
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user, 
      isAuthenticated, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### API Integration Layer

**API Models (`models/`):**
```javascript
// models/workspace.js
import { API_BASE } from '../utils/constants';
import { baseHeaders } from '../utils/request';

const Workspace = {
  list: async () => {
    const response = await fetch(`${API_BASE}/workspaces`, {
      headers: baseHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch workspaces');
    }
    
    const { workspaces } = await response.json();
    return workspaces;
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE}/workspace/new`, {
      method: 'POST',
      headers: baseHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create workspace');
    }
    
    return await response.json();
  },

  update: async (slug, updates) => {
    const response = await fetch(`${API_BASE}/workspace/${slug}/update`, {
      method: 'POST',
      headers: baseHeaders(),
      body: JSON.stringify(updates)
    });
    
    return await response.json();
  },

  delete: async (slug) => {
    const response = await fetch(`${API_BASE}/workspace/${slug}`, {
      method: 'DELETE',
      headers: baseHeaders()
    });
    
    return response.ok;
  }
};

export default Workspace;
```

---

## 🧪 Testing

### Manual Testing Checklist

**Development Environment:**
- [ ] All services start without errors
- [ ] Hot reload works on code changes
- [ ] Database operations work correctly  
- [ ] File uploads process successfully
- [ ] Chat functionality works
- [ ] API endpoints return expected responses

**Feature Testing Template:**
```markdown
## Feature: [Feature Name]

### Prerequisites  
- [ ] Development environment running
- [ ] Test data available
- [ ] Required integrations configured

### Test Cases
1. **Happy Path**
   - [ ] Feature works as expected
   - [ ] UI updates correctly
   - [ ] Data persists properly

2. **Edge Cases**  
   - [ ] Invalid input handling
   - [ ] Empty state handling
   - [ ] Error scenarios

3. **Integration**
   - [ ] Works with existing features
   - [ ] API responses correct
   - [ ] Database updates properly
```

### Automated Testing (Recommended Setup)

**Unit Testing with Jest:**
```bash
# Install testing dependencies
cd server
npm install --save-dev jest supertest

cd ../frontend  
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

**Example Backend Test:**
```javascript
// server/__tests__/workspace.test.js
const request = require('supertest');
const app = require('../index');

describe('Workspace API', () => {
  test('GET /api/workspaces returns workspaces', async () => {
    const response = await request(app)
      .get('/api/workspaces')
      .expect(200);
      
    expect(response.body).toHaveProperty('workspaces');
    expect(Array.isArray(response.body.workspaces)).toBe(true);
  });
  
  test('POST /api/workspace creates workspace', async () => {
    const workspaceData = {
      name: 'Test Workspace',
      description: 'Test description'
    };
    
    const response = await request(app)
      .post('/api/workspace/new')
      .send(workspaceData)
      .expect(201);
      
    expect(response.body).toHaveProperty('workspace');
    expect(response.body.workspace.name).toBe(workspaceData.name);
  });
});
```

**Example Frontend Test:**
```jsx
// frontend/src/__tests__/Workspace.test.jsx  
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Workspace from '../components/Workspace';

describe('Workspace Component', () => {
  test('renders workspace list', async () => {
    render(<Workspace />);
    
    await waitFor(() => {
      expect(screen.getByText('My Workspaces')).toBeInTheDocument();
    });
  });
  
  test('creates new workspace', async () => {
    render(<Workspace />);
    
    const createButton = screen.getByText('Create Workspace');
    fireEvent.click(createButton);
    
    const nameInput = screen.getByPlaceholderText('Workspace name');
    fireEvent.change(nameInput, { target: { value: 'New Workspace' } });
    
    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('New Workspace')).toBeInTheDocument();
    });
  });
});
```

---

## 🤝 Contributing

### Getting Started

1. **Fork Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/anything-llm.git
   cd anything-llm
   git remote add upstream https://github.com/Mintplex-Labs/anything-llm.git
   ```

2. **Setup Development**
   ```bash
   yarn setup
   yarn dev:all
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

### Contribution Workflow

1. **Follow Issue Template**
   - Create issue describing feature/bug
   - Get feedback from maintainers
   - Ensure issue is approved before starting work

2. **Development Standards**
   - Follow existing code style
   - Add comments for complex logic  
   - Update documentation if needed
   - Test your changes thoroughly

3. **Pull Request Process**
   ```bash
   # Update from upstream
   git fetch upstream
   git rebase upstream/master
   
   # Push your changes
   git push origin feature/your-feature-name
   
   # Create PR on GitHub
   ```

4. **PR Requirements**
   - [ ] Descriptive title and description
   - [ ] Reference related issue(s)
   - [ ] Include testing steps
   - [ ] Screenshots for UI changes
   - [ ] Documentation updates if needed

### Code Review Process

**Before Submitting:**
- [ ] Code follows project standards
- [ ] No console.log statements (use proper logging)
- [ ] Error handling implemented
- [ ] Mobile responsiveness (for UI changes)
- [ ] Cross-browser compatibility tested

**Review Criteria:**
- Functionality works as described
- Code is readable and maintainable  
- No security vulnerabilities
- Performance considerations addressed
- Breaking changes noted

### Release Process

**Version Numbering:**
- `MAJOR.MINOR.PATCH` (Semantic Versioning)
- `0.2.0` → `0.2.1` (patch)
- `0.2.0` → `0.3.0` (minor)  
- `0.2.0` → `1.0.0` (major)

**Branch Strategy:**
- `master` - stable releases
- `development` - integration branch
- `feature/*` - feature branches
- `fix/*` - bug fix branches
- `hotfix/*` - critical fixes

---

## 🎯 Next Steps

### For New Developers

1. **Complete Setup**: Follow installation guide
2. **Explore Codebase**: Start with `server/index.js` and `frontend/src/App.jsx`
3. **Make First Change**: Fix a small bug or improve documentation
4. **Join Community**: [Discord](https://discord.gg/6UyHPeGZAC) for questions

### For Experienced Contributors  

1. **Check Issues**: Look for `good first issue` or `help wanted` labels
2. **Propose Features**: Create detailed feature proposals
3. **Code Reviews**: Help review other contributors' PRs
4. **Documentation**: Improve guides and API documentation

### Resources

- 📚 [Official Documentation](https://docs.anythingllm.com)
- 💬 [Discord Community](https://discord.gg/6UyHPeGZAC)
- 🐛 [Bug Reports](https://github.com/Mintplex-Labs/anything-llm/issues)
- 📝 [Feature Requests](https://github.com/Mintplex-Labs/anything-llm/discussions)

---

**Happy coding!** 🚀