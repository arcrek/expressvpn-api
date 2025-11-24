const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const dbPath = process.env.DB_PATH || './data/products.db';
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        throw err;
    }
    console.log('✓ Connected to SQLite database');
});

// Enable WAL mode for better concurrency
db.run('PRAGMA journal_mode = WAL');

// Promisify database methods with proper context
function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes, lastID: this.lastID });
        });
    });
}

const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Initialize database schema
async function initializeDatabase() {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product TEXT NOT NULL,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_sold BOOLEAN DEFAULT 0,
            order_id TEXT NULL,
            sold_date DATETIME NULL
        )
    `;

    const createIndexSoldSQL = `
        CREATE INDEX IF NOT EXISTS idx_is_sold ON products(is_sold)
    `;

    const createIndexUploadDateSQL = `
        CREATE INDEX IF NOT EXISTS idx_upload_date ON products(upload_date)
    `;

    try {
        await dbRun(createTableSQL);
        await dbRun(createIndexSoldSQL);
        await dbRun(createIndexUploadDateSQL);
        console.log('✓ Database initialized successfully');
    } catch (error) {
        console.error('✗ Error initializing database:', error.message);
        throw error;
    }
}

// Initialize on module load
initializeDatabase().catch(console.error);

// Database query functions (replacing prepared statements)
const queries = {
    async getAvailableCount() {
        return await dbGet('SELECT COUNT(*) as sum FROM products WHERE is_sold = 0');
    },
    
    async getAvailableProducts(limit) {
        return await dbAll(`
            SELECT id, product FROM products 
            WHERE is_sold = 0 
            ORDER BY id ASC 
            LIMIT ?
        `, [limit]);
    },
    
    async markProductsAsSold(orderId, productId) {
        return await dbRun(`
            UPDATE products 
            SET is_sold = 1, order_id = ?, sold_date = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [orderId, productId]);
    },
    
    async insertProduct(product) {
        return await dbRun('INSERT INTO products (product) VALUES (?)', [product]);
    },
    
    async getAllProducts() {
        return await dbAll(`
            SELECT id, product, upload_date, is_sold, order_id, sold_date 
            FROM products 
            ORDER BY upload_date DESC, id DESC
        `);
    },
    
    async getProductsByStatus(status) {
        return await dbAll(`
            SELECT id, product, upload_date, is_sold, order_id, sold_date 
            FROM products 
            WHERE is_sold = ? 
            ORDER BY upload_date DESC, id DESC
        `, [status]);
    },
    
    async deleteProduct(id) {
        return await dbRun('DELETE FROM products WHERE id = ?', [id]);
    },
    
    async getStats() {
        return await dbGet(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_sold = 0 THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN is_sold = 1 THEN 1 ELSE 0 END) as sold
            FROM products
        `);
    },
    
    async getRecentUploads() {
        return await dbAll(`
            SELECT product, upload_date 
            FROM products 
            ORDER BY upload_date DESC 
            LIMIT 10
        `);
    },
    
    async getRecentSales() {
        return await dbAll(`
            SELECT product, order_id, sold_date 
            FROM products 
            WHERE is_sold = 1 
            ORDER BY sold_date DESC 
            LIMIT 10
        `);
    }
};

// Transaction helper
async function runInTransaction(callback) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            Promise.resolve(callback())
                .then((result) => {
                    db.run('COMMIT', (err) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                })
                .catch((error) => {
                    db.run('ROLLBACK', () => {
                        reject(error);
                    });
                });
        });
    });
}

module.exports = {
    db,
    queries,
    runInTransaction,
    dbRun,
    dbGet,
    dbAll
};
