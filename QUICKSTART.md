# 🚀 Quick Start Guide

## 🎯 5-Minute Setup

### Windows Users

```powershell
# Run setup script
setup.bat

# Edit .env file with your credentials (use notepad or any editor)
notepad .env

# Start the server
npm start
```

### Linux/Mac Users

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup script
./setup.sh

# Edit .env file with your credentials
nano .env

# Start the server
npm start
```

### Docker Users (All Platforms)

```bash
# 1. Copy environment template
# Windows:
copy env.example .env
# Linux/Mac:
cp env.example .env

# 2. Edit .env with your credentials
# Windows: notepad .env
# Linux/Mac: nano .env

# 3. Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📝 What to Configure

Edit your `.env` file:

```env
# Change this to a strong, unique API key
API_KEY=17e7068f-f366-4120-83e3-e0ec1212da49

# Change these dashboard credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123

# Optional: change port if 3000 is already in use
PORT=3000
```

## ✅ Verify Installation

1. **Open your browser**: http://localhost:3000
2. **Login** with your credentials from `.env`
3. **Upload test products**: Use `sample-products.txt`

## 🧪 Test API

### Test 1: Get inventory count
```bash
curl "http://localhost:3000/input?key=YOUR_API_KEY"
```

Expected response:
```json
{"sum": 15}
```

### Test 2: Get products
```bash
curl "http://localhost:3000/input?key=YOUR_API_KEY&order_id=TEST001&quantity=3"
```

Expected response:
```json
[
  {"product": "ExpressVPN Premium Account 1 Year"},
  {"product": "ExpressVPN Premium Account 6 Months"},
  {"product": "ExpressVPN Premium Account 3 Months"}
]
```

## 🎨 Using the Dashboard

1. **Navigate** to http://localhost:3000
2. **Login** with credentials from `.env`
3. **Upload Products**:
   - Use the file upload button and select `sample-products.txt`
   - OR paste products directly in the text area
4. **Manage Products**:
   - View all products in the table
   - Filter by status (Available/Sold)
   - Delete individual or multiple products
5. **View Statistics**:
   - See total, available, and sold counts
   - Check recent uploads and sales

## 🐳 Docker Commands Reference

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build

# Remove everything (including database!)
docker-compose down -v
```

## 🔧 Common Issues

### Port 3000 already in use
```bash
# Option 1: Change PORT in .env file
PORT=3001

# Option 2: Stop the conflicting service
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Database locked error
```bash
# Stop the server and remove lock files
rm data/*.db-wal data/*.db-shm

# Restart the server
npm start
```

### Cannot access dashboard
1. Check if server is running: http://localhost:3000/health
2. Verify credentials in `.env` file
3. Try clearing browser cache
4. Check firewall settings

## 📊 Production Deployment

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name expressvpn-api

# View logs
pm2 logs expressvpn-api

# Stop
pm2 stop expressvpn-api

# Restart
pm2 restart expressvpn-api

# Auto-start on system boot
pm2 startup
pm2 save
```

### Using Docker in Production

```bash
# Build production image
docker build -t expressvpn-api:latest .

# Run with restart policy
docker run -d \
  --name expressvpn-api \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  expressvpn-api:latest
```

## 🔐 Security Checklist

- [ ] Change default API_KEY in `.env`
- [ ] Change default ADMIN_PASSWORD in `.env`
- [ ] Use HTTPS in production (reverse proxy like Nginx)
- [ ] Enable firewall rules
- [ ] Regularly backup the database (`data/products.db`)
- [ ] Monitor logs for suspicious activity
- [ ] Keep dependencies updated: `npm update`

## 📈 Performance Tips

1. **Enable Caching**: Set `ENABLE_CACHE=true` in `.env`
2. **Use Docker**: Better resource isolation
3. **Reverse Proxy**: Use Nginx for load balancing
4. **Monitor**: Use PM2 or similar for process monitoring
5. **Backup**: Schedule regular database backups

## 🆘 Get Help

1. Check the full [README.md](README.md) for detailed documentation
2. Review the [plan.mdc](plan.mdc) for architecture details
3. Check logs: `docker-compose logs -f` or `pm2 logs`

---

**You're all set! 🎉 Start managing your products now!**

