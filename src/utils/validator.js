// Input validation utilities

function validateQuantity(quantity) {
    const qty = parseInt(quantity);
    
    if (isNaN(qty)) {
        return { valid: false, error: 'Quantity must be a number' };
    }
    
    if (qty < 1) {
        return { valid: false, error: 'Quantity must be at least 1' };
    }
    
    if (qty > 200) {
        return { valid: false, error: 'Quantity cannot exceed 200' };
    }
    
    return { valid: true, value: qty };
}

function validateOrderId(orderId) {
    if (!orderId || typeof orderId !== 'string') {
        return { valid: false, error: 'Order ID is required' };
    }
    
    if (orderId.length > 100) {
        return { valid: false, error: 'Order ID is too long' };
    }
    
    return { valid: true, value: orderId.trim() };
}

function validateProductText(text) {
    if (!text || typeof text !== 'string') {
        return { valid: false, error: 'Product text is required' };
    }
    
    const trimmed = text.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Product text cannot be empty' };
    }
    
    if (trimmed.length > 500) {
        return { valid: false, error: 'Product text is too long (max 500 characters)' };
    }
    
    return { valid: true, value: trimmed };
}

function parseProductsFromText(text) {
    if (!text) {
        return [];
    }
    
    // Split by newlines and filter empty lines
    const lines = text.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    return lines;
}

module.exports = {
    validateQuantity,
    validateOrderId,
    validateProductText,
    parseProductsFromText
};

