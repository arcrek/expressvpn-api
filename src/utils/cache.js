// Simple in-memory cache for inventory count
class Cache {
    constructor() {
        this.cache = {};
        this.enabled = process.env.ENABLE_CACHE === 'true';
        this.ttl = parseInt(process.env.CACHE_TTL || '60') * 1000; // Convert to milliseconds
    }

    get(key) {
        if (!this.enabled) return null;
        
        const item = this.cache[key];
        
        if (!item) return null;
        
        // Check if expired
        if (Date.now() > item.expiry) {
            delete this.cache[key];
            return null;
        }
        
        return item.value;
    }

    set(key, value) {
        if (!this.enabled) return;
        
        this.cache[key] = {
            value,
            expiry: Date.now() + this.ttl
        };
    }

    invalidate(key) {
        delete this.cache[key];
    }

    clear() {
        this.cache = {};
    }
}

module.exports = new Cache();

