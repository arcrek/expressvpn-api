# 📁 Project Structure

```
expressvpn-api/
│
├── 📄 Configuration Files
│   ├── package.json              # Node.js dependencies and scripts
│   ├── .env.example              # Environment variables template
│   ├── .gitignore                # Git ignore rules
│   ├── .dockerignore             # Docker ignore rules
│   ├── Dockerfile                # Docker image configuration
│   └── docker-compose.yml        # Docker Compose orchestration
│
├── 📚 Documentation
│   ├── README.md                 # Full project documentation
│   ├── QUICKSTART.md             # Quick setup guide
│   ├── PROJECT_STRUCTURE.md      # This file
│   ├── plan.mdc                  # Technical implementation plan
│   └── api.md                    # Original API specification
│
├── 🛠️ Setup Scripts
│   ├── setup.bat                 # Windows setup script
│   └── setup.sh                  # Linux/Mac setup script
│
├── 📝 Sample Data
│   └── sample-products.txt       # Sample products for testing
│
├── 🗄️ Database
│   └── data/                     # SQLite database storage
│       ├── .gitkeep              # Keep directory in git
│       └── products.db           # SQLite database (created at runtime)
│
├── 💻 Backend Source Code
│   └── src/
│       ├── 📁 config/            # Configuration modules
│       │   ├── database.js       # Database setup & prepared statements
│       │   └── init-database.js  # Database initialization script
│       │
│       ├── 📁 middleware/        # Express middleware
│       │   └── auth.js           # API key & dashboard authentication
│       │
│       ├── 📁 utils/             # Utility functions
│       │   ├── cache.js          # In-memory caching
│       │   └── validator.js      # Input validation
│       │
│       ├── 📁 controllers/       # Business logic
│       │   ├── inventory.js      # Inventory API logic
│       │   └── products.js       # Product management logic
│       │
│       ├── 📁 routes/            # Express routes
│       │   ├── api.js            # Main API endpoints
│       │   └── dashboard.js      # Dashboard API endpoints
│       │
│       └── server.js             # Main application entry point
│
└── 🎨 Frontend Dashboard
    └── public/
        ├── index.html            # Dashboard HTML
        ├── 📁 css/
        │   └── style.css         # Dashboard styles
        └── 📁 js/
            └── app.js            # Dashboard JavaScript

```

## 🔍 File Descriptions

### Core Application Files

#### `src/server.js`
- Main Express application entry point
- Server configuration and middleware setup
- Route registration
- Error handling

#### `src/config/database.js`
- SQLite database connection
- Database schema initialization
- Prepared statements for performance
- Database indexes

#### `src/controllers/inventory.js`
- Get inventory count (with caching)
- Get products and mark as sold (transactional)
- Main API logic as per api.md specification

#### `src/controllers/products.js`
- Upload products from text
- List products with filters
- Delete single/multiple products
- Get statistics

#### `src/middleware/auth.js`
- API key validation for API endpoints
- Basic authentication for dashboard
- Security middleware

#### `src/routes/api.js`
- `/input` endpoint for inventory operations
- Handles both count and get products based on params

#### `src/routes/dashboard.js`
- `/api/products/*` endpoints for CRUD operations
- `/api/stats` for dashboard statistics
- File upload handling

### Frontend Files

#### `public/index.html`
- Modern, responsive dashboard UI
- Statistics cards
- Product upload forms
- Product management table
- Recent activity sections

#### `public/css/style.css`
- Modern, gradient design
- Responsive layout
- Card-based UI components
- Professional styling

#### `public/js/app.js`
- Dashboard interactivity
- AJAX calls to backend API
- Real-time updates
- Form handling and validation

### Docker Files

#### `Dockerfile`
- Multi-stage build for optimization
- Alpine Linux base (smaller image)
- Health check configuration
- Production-ready setup

#### `docker-compose.yml`
- Single-service architecture
- Volume mounting for database
- Environment configuration
- Network setup
- Auto-restart policy

### Configuration Files

#### `package.json`
- Project metadata
- Dependencies (Express, SQLite, etc.)
- NPM scripts (start, dev, init-db)

#### `.env.example`
- Environment variable template
- API key configuration
- Dashboard credentials
- Performance settings

## 🎯 Key Features by File

### Performance Features
- **cache.js**: In-memory caching for inventory count
- **database.js**: Prepared statements for fast queries
- **server.js**: Compression and optimization middleware

### Security Features
- **auth.js**: API key + Basic auth implementation
- **validator.js**: Input sanitization and validation
- **server.js**: Helmet.js security headers, rate limiting

### Transaction Safety
- **database.js**: WAL mode for concurrency
- **inventory.js**: Transaction-based product selling
- **products.js**: Bulk operations in transactions

### User Experience
- **app.js**: Real-time updates and notifications
- **style.css**: Modern, intuitive UI design
- **index.html**: Comprehensive dashboard features

## 📊 Data Flow

### API Request Flow
```
Client → server.js → middleware/auth.js → routes/api.js 
  → controllers/inventory.js → config/database.js → SQLite
```

### Dashboard Flow
```
Browser → public/index.html → public/js/app.js 
  → server.js → middleware/auth.js → routes/dashboard.js
  → controllers/products.js → config/database.js → SQLite
```

## 🔄 Typical Operations

### Upload Products
```
Dashboard UI → app.js (uploadFile/uploadText) 
  → /api/products/upload → products.js (uploadProducts)
  → database.js (transaction) → SQLite → Response → UI Update
```

### Get Products (API)
```
External System → /input?key=X&order_id=Y&quantity=Z
  → auth.js (validateApiKey) → inventory.js (getProducts)
  → database.js (transaction: select + update) 
  → SQLite → JSON Response
```

### Delete Products
```
Dashboard UI → app.js (deleteProduct/bulkDelete)
  → /api/products/:id or /api/products/bulk-delete
  → products.js → database.js → SQLite 
  → Response → UI Refresh
```

## 🛠️ Extensibility Points

### Adding New API Endpoints
1. Add controller function in `src/controllers/`
2. Add route in `src/routes/`
3. Update documentation

### Adding New Dashboard Features
1. Update HTML in `public/index.html`
2. Add styles in `public/css/style.css`
3. Add JavaScript in `public/js/app.js`
4. Create backend API if needed

### Changing Database Schema
1. Update schema in `src/config/database.js`
2. Update prepared statements
3. Add migration logic if needed
4. Update controllers

### Adding Authentication Methods
1. Add new middleware in `src/middleware/auth.js`
2. Apply to routes as needed
3. Update frontend if necessary

---

**This structure is optimized for:**
- ✅ Fast development
- ✅ Easy maintenance
- ✅ Clear separation of concerns
- ✅ Scalability up to 200 products
- ✅ Docker deployment

