const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryService');

// Get all inventories
router.get('/inventories', async (req, res) => {
    try {
        const inventories = await inventoryService.getAllInventories();
        res.json({ inventories });
    } catch (error) {
        console.error('Error getting inventories:', error);
        res.status(500).json({ error: 'Failed to get inventories' });
    }
});

// Get single inventory
router.get('/inventories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const inventory = await inventoryService.getInventoryById(parseInt(id));
        
        if (!inventory) {
            return res.status(404).json({ error: 'Inventory not found' });
        }

        res.json(inventory);
    } catch (error) {
        console.error('Error getting inventory:', error);
        res.status(500).json({ error: 'Failed to get inventory' });
    }
});

// Create new inventory
router.post('/inventories', express.json(), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Inventory name is required' });
        }

        const result = await inventoryService.createInventory(
            name.trim(),
            description?.trim() || ''
        );

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({
            success: true,
            message: 'Inventory created successfully',
            id: result.id
        });
    } catch (error) {
        console.error('Error creating inventory:', error);
        res.status(500).json({ error: 'Failed to create inventory' });
    }
});

// Update inventory
router.put('/inventories/:id', express.json(), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Inventory name is required' });
        }

        const result = await inventoryService.updateInventory(
            parseInt(id),
            name.trim(),
            description?.trim() || '',
            is_active
        );

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({
            success: true,
            message: 'Inventory updated successfully'
        });
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ error: 'Failed to update inventory' });
    }
});

// Delete inventory
router.delete('/inventories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await inventoryService.deleteInventory(parseInt(id));

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({
            success: true,
            message: 'Inventory deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting inventory:', error);
        res.status(500).json({ error: 'Failed to delete inventory' });
    }
});

// Get inventory stats
router.get('/inventories/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const stats = await inventoryService.getInventoryStats(parseInt(id));
        res.json(stats);
    } catch (error) {
        console.error('Error getting inventory stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

module.exports = router;

