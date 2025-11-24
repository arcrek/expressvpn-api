// Global state
let selectedProducts = new Set();
let allProducts = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadProducts();
});

// Logout function
async function logout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login';
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Get auth headers
function getAuthHeaders() {
    // Basic auth is handled by browser
    return {
        'Content-Type': 'application/json'
    };
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to load statistics');
        }
        
        const data = await response.json();
        
        // Update stats cards
        document.getElementById('totalProducts').textContent = data.stats.total;
        document.getElementById('availableProducts').textContent = data.stats.available;
        document.getElementById('soldProducts').textContent = data.stats.sold;
        
        // Update recent uploads
        const uploadsHtml = data.recentUploads.length > 0
            ? data.recentUploads.map(item => `
                <div class="activity-item">
                    <div class="activity-product">${escapeHtml(item.product)}</div>
                    <div class="activity-meta">${formatDate(item.upload_date)}</div>
                </div>
            `).join('')
            : '<div class="loading">No recent uploads</div>';
        
        document.getElementById('recentUploads').innerHTML = uploadsHtml;
        
        // Update recent sales
        const salesHtml = data.recentSales.length > 0
            ? data.recentSales.map(item => `
                <div class="activity-item">
                    <div class="activity-product">${escapeHtml(item.product)}</div>
                    <div class="activity-meta">Order: ${escapeHtml(item.order_id)} • ${formatDate(item.sold_date)}</div>
                </div>
            `).join('')
            : '<div class="loading">No recent sales</div>';
        
        document.getElementById('recentSales').innerHTML = salesHtml;
        
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Failed to load statistics', 'error');
    }
}

// Load products
async function loadProducts(status = 'all') {
    try {
        const url = status === 'all' 
            ? '/api/products' 
            : `/api/products?status=${status}`;
        
        const response = await fetch(url);
        
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        
        const data = await response.json();
        allProducts = data.products;
        
        displayProducts(allProducts);
        
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsBody').innerHTML = `
            <tr><td colspan="7" class="error">Failed to load products</td></tr>
        `;
        showToast('Failed to load products', 'error');
    }
}

// Display products in table
function displayProducts(products) {
    const tbody = document.getElementById('productsBody');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No products found</td></tr>';
        return;
    }
    
    const html = products.map(product => `
        <tr>
            <td><input type="checkbox" class="product-checkbox" data-id="${product.id}" onchange="updateSelection()"></td>
            <td>${product.id}</td>
            <td title="${escapeHtml(product.product)}">${escapeHtml(truncate(product.product, 50))}</td>
            <td>${formatDate(product.upload_date)}</td>
            <td>
                <span class="badge ${product.is_sold ? 'badge-warning' : 'badge-success'}">
                    ${product.is_sold ? 'Sold' : 'Available'}
                </span>
            </td>
            <td>${product.order_id ? escapeHtml(product.order_id) : '-'}</td>
            <td>
                <button onclick="deleteProduct(${product.id})" class="btn btn-danger btn-small">Delete</button>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = html;
}

// Upload file
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('Please select a file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/products/upload', {
            method: 'POST',
            body: formData
        });
        
        // Check if we got HTML (redirect to login)
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            window.location.href = '/login';
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(data.error || 'Upload failed');
        }
        
        const resultDiv = document.getElementById('uploadResult');
        resultDiv.className = 'result success';
        resultDiv.textContent = `✓ Successfully uploaded ${data.inserted} products${data.skipped > 0 ? ` (${data.skipped} skipped)` : ''}`;
        
        showToast(`Successfully uploaded ${data.inserted} products`, 'success');
        
        // Reset and refresh
        fileInput.value = '';
        loadStats();
        loadProducts();
        
    } catch (error) {
        console.error('Error uploading file:', error);
        const resultDiv = document.getElementById('uploadResult');
        resultDiv.className = 'result error';
        resultDiv.textContent = `✗ ${error.message}`;
        showToast(error.message, 'error');
    }
}

// Upload text
async function uploadText() {
    const textInput = document.getElementById('textInput');
    const products = textInput.value;
    
    if (!products.trim()) {
        showToast('Please enter products', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/products/upload-text', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ products })
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            window.location.href = '/login';
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(data.error || 'Upload failed');
        }
        
        const resultDiv = document.getElementById('uploadResult');
        resultDiv.className = 'result success';
        resultDiv.textContent = `✓ Successfully uploaded ${data.inserted} products${data.skipped > 0 ? ` (${data.skipped} skipped)` : ''}`;
        
        showToast(`Successfully uploaded ${data.inserted} products`, 'success');
        
        // Reset and refresh
        textInput.value = '';
        loadStats();
        loadProducts();
        
    } catch (error) {
        console.error('Error uploading text:', error);
        const resultDiv = document.getElementById('uploadResult');
        resultDiv.className = 'result error';
        resultDiv.textContent = `✗ ${error.message}`;
        showToast(error.message, 'error');
    }
}

// Filter products
function filterProducts() {
    const status = document.getElementById('statusFilter').value;
    loadProducts(status);
}

// Refresh products
function refreshProducts() {
    const status = document.getElementById('statusFilter').value;
    loadProducts(status);
    loadStats();
    showToast('Refreshed', 'info');
}

// Delete product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Delete failed');
        }
        
        showToast('Product deleted successfully', 'success');
        loadStats();
        loadProducts();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast(error.message, 'error');
    }
}

// Toggle select all
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.product-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
    
    updateSelection();
}

// Update selection
function updateSelection() {
    const checkboxes = document.querySelectorAll('.product-checkbox:checked');
    selectedProducts.clear();
    
    checkboxes.forEach(checkbox => {
        selectedProducts.add(parseInt(checkbox.dataset.id));
    });
    
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    bulkDeleteBtn.style.display = selectedProducts.size > 0 ? 'block' : 'none';
    
    // Update select all checkbox
    const allCheckboxes = document.querySelectorAll('.product-checkbox');
    const selectAll = document.getElementById('selectAll');
    selectAll.checked = allCheckboxes.length > 0 && checkboxes.length === allCheckboxes.length;
}

// Bulk delete
async function bulkDelete() {
    if (selectedProducts.size === 0) {
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} products?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/products/bulk-delete', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ids: Array.from(selectedProducts) })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Bulk delete failed');
        }
        
        showToast(`Successfully deleted ${data.deleted} products`, 'success');
        
        selectedProducts.clear();
        document.getElementById('selectAll').checked = false;
        loadStats();
        loadProducts();
        
    } catch (error) {
        console.error('Error bulk deleting:', error);
        showToast(error.message, 'error');
    }
}

// Delete by date functionality
let productsToDelete = [];

function showDeleteByDateModal() {
    const modal = document.getElementById('deleteByDateModal');
    modal.classList.add('show');
    
    // Set default date to 7 days ago
    const date = new Date();
    date.setDate(date.getDate() - 7);
    document.getElementById('deleteBeforeDate').value = date.toISOString().split('T')[0];
    
    // Reset preview
    document.getElementById('deleteByDatePreview').classList.remove('show');
    document.getElementById('confirmDeleteBtn').style.display = 'none';
}

function closeDeleteByDateModal() {
    const modal = document.getElementById('deleteByDateModal');
    modal.classList.remove('show');
    productsToDelete = [];
}

async function previewDeleteByDate() {
    const dateInput = document.getElementById('deleteBeforeDate');
    const selectedDate = dateInput.value;
    
    if (!selectedDate) {
        showToast('Please select a date', 'error');
        return;
    }
    
    try {
        // Get all available products
        const response = await fetch('/api/products?status=available');
        
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        
        const data = await response.json();
        const products = data.products;
        
        // Filter products uploaded before selected date
        const selectedDateTime = new Date(selectedDate + 'T23:59:59').getTime();
        productsToDelete = products.filter(p => {
            const uploadTime = new Date(p.upload_date).getTime();
            return uploadTime <= selectedDateTime;
        });
        
        // Show preview
        const previewDiv = document.getElementById('deleteByDatePreview');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        if (productsToDelete.length === 0) {
            previewDiv.innerHTML = `
                <div class="preview-count" style="color: #10b981;">
                    ✓ No unsold products found before ${formatDateShort(selectedDate)}
                </div>
            `;
            previewDiv.classList.add('show');
            confirmBtn.style.display = 'none';
        } else {
            const previewItems = productsToDelete.slice(0, 10).map(p => `
                <div class="preview-item">
                    <strong>${escapeHtml(p.product)}</strong><br>
                    <small>Uploaded: ${formatDate(p.upload_date)}</small>
                </div>
            `).join('');
            
            const moreText = productsToDelete.length > 10 
                ? `<div class="preview-item"><em>...and ${productsToDelete.length - 10} more</em></div>` 
                : '';
            
            previewDiv.innerHTML = `
                <div class="preview-count">
                    ⚠️ ${productsToDelete.length} unsold product${productsToDelete.length > 1 ? 's' : ''} will be deleted
                </div>
                <div class="preview-list">
                    ${previewItems}
                    ${moreText}
                </div>
            `;
            previewDiv.classList.add('show');
            confirmBtn.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error previewing delete:', error);
        showToast('Failed to preview products', 'error');
    }
}

async function confirmDeleteByDate() {
    if (productsToDelete.length === 0) {
        return;
    }
    
    const count = productsToDelete.length;
    if (!confirm(`Are you sure you want to delete ${count} unsold product${count > 1 ? 's' : ''}?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        const ids = productsToDelete.map(p => p.id);
        
        const response = await fetch('/api/products/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        });
        
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Delete failed');
        }
        
        showToast(`Successfully deleted ${data.deleted} products`, 'success');
        
        closeDeleteByDateModal();
        loadStats();
        loadProducts();
        
    } catch (error) {
        console.error('Error deleting products:', error);
        showToast(error.message, 'error');
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncate(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatDateShort(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

