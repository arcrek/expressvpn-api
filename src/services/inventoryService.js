const { queries, dbRun, dbGet } = require('../config/database');

class InventoryService {
    async getAllInventories() {
        try {
            const inventories = await queries.getAllInventories();
            
            // Get product counts for each inventory
            const inventoriesWithCounts = await Promise.all(
                inventories.map(async (inv) => {
                    const stats = await queries.getStats(inv.id);
                    return {
                        ...inv,
                        total_products: stats?.total || 0,
                        available_products: stats?.available || 0,
                        sold_products: stats?.sold || 0
                    };
                })
            );
            
            return inventoriesWithCounts;
        } catch (error) {
            console.error('Error getting inventories:', error);
            return [];
        }
    }

    async getInventoryById(id) {
        try {
            const inventory = await queries.getInventoryById(id);
            if (!inventory) {
                return null;
            }

            // Get stats for this inventory
            const stats = await queries.getStats(id);
            
            return {
                ...inventory,
                total_products: stats?.total || 0,
                available_products: stats?.available || 0,
                sold_products: stats?.sold || 0
            };
        } catch (error) {
            console.error('Error getting inventory:', error);
            return null;
        }
    }

    async createInventory(name, description = '') {
        try {
            // Validate name
            if (!name || name.trim().length === 0) {
                return {
                    success: false,
                    error: 'Inventory name is required'
                };
            }

            const trimmedName = name.trim();

            // Check if inventory name already exists
            const existing = await dbGet(
                'SELECT id FROM inventories WHERE name = ?',
                [trimmedName]
            );
            
            if (existing) {
                return {
                    success: false,
                    error: 'An inventory with this name already exists'
                };
            }

            const result = await queries.createInventory(trimmedName, description);

            return {
                success: true,
                id: result.lastID
            };
        } catch (error) {
            console.error('Error creating inventory:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateInventory(id, name, description, isActive) {
        try {
            // Validate name
            if (!name || name.trim().length === 0) {
                return {
                    success: false,
                    error: 'Inventory name is required'
                };
            }

            // Check if it exists
            const existing = await queries.getInventoryById(id);
            if (!existing) {
                return {
                    success: false,
                    error: 'Inventory not found'
                };
            }

            // Check if name is taken by another inventory
            const duplicate = await dbGet(
                'SELECT id FROM inventories WHERE name = ? AND id != ?',
                [name.trim(), id]
            );

            if (duplicate) {
                return {
                    success: false,
                    error: 'An inventory with this name already exists'
                };
            }

            await queries.updateInventory(id, name.trim(), description, isActive);

            return { success: true };
        } catch (error) {
            console.error('Error updating inventory:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteInventory(id) {
        try {
            // Don't allow deleting the default inventory
            if (id === 1) {
                return {
                    success: false,
                    error: 'Cannot delete the default inventory'
                };
            }

            // Check if inventory has products
            const stats = await queries.getStats(id);
            if (stats && stats.total > 0) {
                return {
                    success: false,
                    error: `Cannot delete inventory with ${stats.total} products. Please move or delete the products first.`
                };
            }

            // Check if any API keys are using this inventory
            const apiKeys = await dbGet(
                'SELECT COUNT(*) as count FROM api_keys WHERE inventory_id = ?',
                [id]
            );

            if (apiKeys && apiKeys.count > 0) {
                return {
                    success: false,
                    error: `Cannot delete inventory that is assigned to ${apiKeys.count} API key(s). Please update or delete the API keys first.`
                };
            }

            const result = await queries.deleteInventory(id);

            return {
                success: result.changes > 0,
                error: result.changes === 0 ? 'Inventory not found' : null
            };
        } catch (error) {
            console.error('Error deleting inventory:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getInventoryStats(id) {
        try {
            return await queries.getStats(id);
        } catch (error) {
            console.error('Error getting inventory stats:', error);
            return { total: 0, available: 0, sold: 0 };
        }
    }
}

module.exports = new InventoryService();

