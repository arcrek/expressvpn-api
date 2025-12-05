const { queries, runInTransaction } = require('../config/database');
const { validateQuantity, validateOrderId } = require('../utils/validator');
const cache = require('../utils/cache');
const activityMonitor = require('../services/activityMonitor');

// Get total inventory count (available products)
async function getInventoryCount(req, res) {
    try {
        // Get inventory ID from API key if kiosk mode
        const inventoryId = req.apiKey?.isKiosk ? req.apiKey.inventoryId : null;
        
        // Check cache first (with inventory-specific key for kiosk)
        const cacheKey = inventoryId ? `inventory_count_${inventoryId}` : 'inventory_count';
        const cached = cache.get(cacheKey);
        if (cached !== null) {
            return res.json({ sum: cached });
        }

        // Query database with inventory filter if kiosk mode
        const result = await queries.getAvailableCount(inventoryId);
        const count = result ? result.sum : 0;

        // Cache the result
        cache.set(cacheKey, count);

        res.json({ sum: count });
    } catch (error) {
        console.error('Error getting inventory count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Get products (sell products)
async function getProducts(req, res) {
    const { order_id, quantity } = req.query;

    // Validate order_id
    const orderValidation = validateOrderId(order_id);
    if (!orderValidation.valid) {
        return res.status(400).json({ error: orderValidation.error });
    }

    // Validate quantity
    const quantityValidation = validateQuantity(quantity);
    if (!quantityValidation.valid) {
        return res.status(400).json({ error: quantityValidation.error });
    }

    const orderId = orderValidation.value;
    const qty = quantityValidation.value;

    // Get inventory ID from API key if kiosk mode
    const inventoryId = req.apiKey?.isKiosk ? req.apiKey.inventoryId : null;

    try {
        // Run transaction
        const result = await runInTransaction(async () => {
            // Get available products with inventory filter if kiosk mode
            const products = await queries.getAvailableProducts(qty, inventoryId);

            if (products.length === 0) {
                throw new Error('NO_PRODUCTS_AVAILABLE');
            }

            if (products.length < qty) {
                throw new Error(`INSUFFICIENT_STOCK:${products.length}`);
            }

            // Mark products as sold
            for (const product of products) {
                await queries.markProductsAsSold(orderId, product.id);
            }

            // Return product list in the required format
            return products.map(p => ({ product: p.product }));
        });

        // Invalidate cache (both general and inventory-specific)
        cache.invalidate('inventory_count');
        if (inventoryId) {
            cache.invalidate(`inventory_count_${inventoryId}`);
        }

        // Send notification about sale
        activityMonitor.notifyProductSold(qty, orderId);

        res.json(result);
    } catch (error) {
        console.error('Error getting products:', error);

        if (error.message === 'NO_PRODUCTS_AVAILABLE') {
            return res.status(404).json({ error: 'No products available' });
        }

        if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
            const available = error.message.split(':')[1];
            return res.status(400).json({ 
                error: `Insufficient stock. Only ${available} products available` 
            });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getInventoryCount,
    getProducts
};
