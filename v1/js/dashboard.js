// Dashboard JavaScript
let allSubmissions = [];
let filteredSubmissions = [];
let currentPage = 1;
const itemsPerPage = 10;
let categoryChart = null;
let dailyChart = null;

// Initialize theme
function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
    updateCharts();
});

// Initialize on load
initTheme();

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/submissions/stats');
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('totalSubmissions').textContent = result.data.total;
            document.getElementById('todaySubmissions').textContent = result.data.today;
            document.getElementById('totalCategories').textContent = result.data.byCategory.length;
            
            // Update category filter dropdown
            const categoryFilter = document.getElementById('categoryFilter');
            const existingOptions = categoryFilter.querySelectorAll('option:not(:first-child)');
            existingOptions.forEach(opt => opt.remove());
            
            result.data.byCategory.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.category;
                option.textContent = `${cat.category} (${cat.count})`;
                categoryFilter.appendChild(option);
            });
            
            // Update charts
            updateCategoryChart(result.data.byCategory);
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load all submissions
async function loadSubmissions() {
    try {
        const response = await fetch('/api/submissions');
        const result = await response.json();
        
        if (result.success) {
            allSubmissions = result.data.map(sub => ({
                ...sub,
                timestamp: new Date(sub.timestamp)
            }));
            // Make allSubmissions available globally for GmailIntegration
            window.allSubmissions = allSubmissions;
            filteredSubmissions = [...allSubmissions];
            renderTable();
            updateDailyChart();
        }
    } catch (error) {
        console.error('Error loading submissions:', error);
        document.getElementById('submissionsTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-red-500">
                    Error loading submissions. Please refresh the page.
                </td>
            </tr>
        `;
    }
}

// Update category chart
function updateCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryData.map(c => c.category),
            datasets: [{
                data: categoryData.map(c => c.count),
                backgroundColor: [
                    '#3b82f6', // blue
                    '#10b981', // green
                    '#8b5cf6', // purple
                    '#f59e0b', // amber
                    '#ef4444', // red
                    '#06b6d4', // cyan
                    '#ec4899', // pink
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Update daily chart
function updateDailyChart() {
    const ctx = document.getElementById('dailyChart');
    if (!ctx) return;
    
    if (dailyChart) {
        dailyChart.destroy();
    }
    
    // Get last 7 days of data
    const last7Days = [];
    const dayCounts = {};
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
        dayCounts[dateStr] = 0;
    }
    
    allSubmissions.forEach(sub => {
        const dateStr = sub.timestamp.toISOString().split('T')[0];
        if (dayCounts.hasOwnProperty(dateStr)) {
            dayCounts[dateStr]++;
        }
    });
    
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    
    dailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(d => {
                const date = new Date(d);
                return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Submissions',
                data: last7Days.map(d => dayCounts[d]),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        stepSize: 1
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

// Update charts when theme changes
function updateCharts() {
    if (categoryChart) {
        loadStatistics();
    }
    if (dailyChart) {
        updateDailyChart();
    }
}

// Render table
function renderTable() {
    const tbody = document.getElementById('submissionsTableBody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredSubmissions.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No submissions found.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = pageData.map(sub => {
        const source = sub.source || 'form';
        const sourceIcon = source === 'email' ? '📧' : '📝';
        const sourceLabel = source === 'email' ? 'Email' : 'Form';
        const messagePreview = (sub.subject || sub.message || '').length > 100 
            ? (sub.subject || sub.message || '').substring(0, 100) + '...' 
            : (sub.subject || sub.message || '');
        const dateStr = sub.timestamp.toLocaleDateString('nl-NL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const isUnread = source === 'email' && sub.read_status === 0;
        
        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isUnread ? 'bg-blue-50 dark:bg-blue-900/20' : ''}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm" title="${sourceLabel}">${sourceIcon}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 dark:text-white ${isUnread ? 'font-bold' : ''}">${escapeHtml(sub.email)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        ${escapeHtml(sub.category)}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
                        ${sub.subject ? `<strong>${escapeHtml(sub.subject)}</strong><br/>` : ''}
                        ${escapeHtml(messagePreview)}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${dateStr}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="showDetails(${sub.id})" class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-2">
                        View Details
                    </button>
                    ${source === 'email' && sub.gmail_id ? `
                        ${sub.read_status === 0 ? `<button onclick="window.GmailIntegration.markAsRead('${escapeHtml(sub.gmail_id)}')" class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-1">Mark Read</button>` : ''}
                        <button onclick="window.GmailIntegration.showReplyModal(${sub.id})" class="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 mr-1">Reply</button>
                        <button onclick="window.GmailIntegration.archiveEmail('${escapeHtml(sub.gmail_id)}')" class="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">Archive</button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
    
    // Update pagination
    updatePagination();
}

// Update pagination
function updatePagination() {
    const total = filteredSubmissions.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, total);
    
    document.getElementById('showingFrom').textContent = total > 0 ? startIndex + 1 : 0;
    document.getElementById('showingTo').textContent = endIndex;
    document.getElementById('totalCount').textContent = total;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = endIndex >= total;
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    applyFilters();
});

// Category filter
document.getElementById('categoryFilter').addEventListener('change', (e) => {
    applyFilters();
});

// Sort
document.getElementById('sortSelect').addEventListener('change', (e) => {
    applyFilters();
});

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sourceFilter = document.getElementById('sourceFilter') ? document.getElementById('sourceFilter').value : '';
    const sortOrder = document.getElementById('sortSelect').value;
    
    filteredSubmissions = allSubmissions.filter(sub => {
        const matchesSearch = !searchTerm || 
            sub.email.toLowerCase().includes(searchTerm) ||
            sub.category.toLowerCase().includes(searchTerm) ||
            (sub.subject || '').toLowerCase().includes(searchTerm) ||
            (sub.message || '').toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryFilter || sub.category === categoryFilter;
        const matchesSource = !sourceFilter || sub.source === sourceFilter;
        
        return matchesSearch && matchesCategory && matchesSource;
    });
    
    // Sort
    filteredSubmissions.sort((a, b) => {
        if (sortOrder === 'newest') {
            return b.timestamp - a.timestamp;
        } else {
            return a.timestamp - b.timestamp;
        }
    });
    
    currentPage = 1;
    renderTable();
}

// Pagination
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Show submission details
function showDetails(id) {
    const submission = allSubmissions.find(s => s.id === id);
    if (!submission) return;
    
    const modal = document.getElementById('detailsModal');
    const content = document.getElementById('modalContent');
    
    const dateStr = submission.timestamp.toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    content.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">${escapeHtml(submission.email)}</p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                <p class="mt-1">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        ${escapeHtml(submission.category)}
                    </span>
                </p>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">${dateStr}</p>
            </div>
            ${submission.subject ? `
            <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Subject</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-white font-semibold">${escapeHtml(submission.subject)}</p>
            </div>
            ` : ''}
            <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Message</label>
                <div class="mt-1 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p class="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">${escapeHtml(submission.message || '')}</p>
                </div>
            </div>
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700 flex space-x-4">
                ${submission.source === 'email' && submission.gmail_id ? `
                    <button onclick="window.GmailIntegration.showReplyModalById(${submission.id})" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                        </svg>
                        Reply via Gmail
                    </button>
                    ${submission.read_status === 0 ? `
                    <button onclick="window.GmailIntegration.markAsRead('${escapeHtml(submission.gmail_id)}'); setTimeout(() => location.reload(), 500);" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Mark as Read
                    </button>
                    ` : ''}
                    <button onclick="window.GmailIntegration.archiveEmail('${escapeHtml(submission.gmail_id)}'); setTimeout(() => location.reload(), 500);" class="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        Archive
                    </button>
                ` : `
                <a href="mailto:${escapeHtml(submission.email)}" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    Reply via Email
                </a>
                `}
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
    const modal = document.getElementById('detailsModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
});

// Close modal on background click
document.getElementById('detailsModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailsModal') {
        const modal = document.getElementById('detailsModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
});

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    loadSubmissions();
    
    // Initialize Gmail integration
    if (window.GmailIntegration && window.GmailIntegration.initGmailIntegration) {
        window.GmailIntegration.initGmailIntegration();
    }
    
    // Source filter
    const sourceFilter = document.getElementById('sourceFilter');
    if (sourceFilter) {
        sourceFilter.addEventListener('change', () => {
            applyFilters();
        });
    }
    
    // Refresh data every 30 seconds
    setInterval(() => {
        loadStatistics();
        loadSubmissions();
    }, 30000);
});

