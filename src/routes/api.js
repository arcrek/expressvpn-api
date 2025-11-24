const express = require('express');
const router = express.Router();
const { validateApiKey } = require('../middleware/auth');
const inventoryController = require('../controllers/inventory');

// Main API routes (as specified in api.md)
// All routes require API key validation

// Get total inventory count
// GET /input?key={api_key}
router.get('/input', validateApiKey, (req, res) => {
    // If no additional params, return count
    if (!req.query.order_id && !req.query.quantity) {
        return inventoryController.getInventoryCount(req, res);
    }
    
    // If order_id and quantity are provided, get products
    return inventoryController.getProducts(req, res);
});

module.exports = router;

