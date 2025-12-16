// Email Dashboard - Gmail-style Interface
let allEmails = [];
let filteredEmails = [];
let selectedEmails = new Set();
let currentFolder = 'all';
let currentCategory = null;
let selectedEmailId = null;

// Theme management
function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

document.getElementById('themeToggle')?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
});

initTheme();

// Load emails from API
async function loadEmails() {
    try {
        const response = await fetch('/api/submissions');
        const result = await response.json();
        
        if (result.success) {
            allEmails = result.data.map(email => {
                // Parse attachments from notes field
                let attachments = null;
                if (email.notes) {
                    try {
                        const parsed = JSON.parse(email.notes);
                        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].filename) {
                            attachments = parsed;
                        }
                    } catch (e) {}
                }
                
                return {
                    id: email.id,
                    email: email.email || '',
                    category: email.category || 'Algemene vraag',
                    subject: email.subject || '',
                    message: email.message || '',
                    html_message: email.html_message || null,
                    timestamp: new Date(email.timestamp),
                    source: email.source || 'form',
                    gmail_id: email.gmail_id || null,
                    thread_id: email.thread_id || null,
                    read_status: email.read_status || 0,
                    starred: email.starred || 0,
                    priority: email.priority || 'medium',
                    response_status: email.response_status || 'pending',
                    attachments: attachments
                };
            });
            
            applyFilters();
            updateCounts();
        }
    } catch (error) {
        console.error('Error loading emails:', error);
        showEmptyState('Error loading emails. Please refresh.');
    }
}

// Update folder counts
function updateCounts() {
    document.getElementById('count-all').textContent = allEmails.length;
    document.getElementById('count-unread').textContent = allEmails.filter(e => e.read_status === 0).length;
    document.getElementById('count-starred').textContent = allEmails.filter(e => e.starred === 1).length;
}

// Apply filters based on current folder/category
function applyFilters() {
    let emails = [...allEmails];
    
    // Filter by folder
    if (currentFolder === 'unread') {
        emails = emails.filter(e => e.read_status === 0);
    } else if (currentFolder === 'starred') {
        emails = emails.filter(e => e.starred === 1);
    }
    
    // Filter by category
    if (currentCategory) {
        emails = emails.filter(e => e.category === currentCategory);
    }
    
    // Apply search
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    if (searchTerm) {
        emails = emails.filter(e => 
            (e.email || '').toLowerCase().includes(searchTerm) ||
            (e.subject || '').toLowerCase().includes(searchTerm) ||
            (e.message || '').toLowerCase().includes(searchTerm)
        );
    }
    
    filteredEmails = emails;
    renderEmailList();
}

// Render email list
function renderEmailList() {
    const container = document.getElementById('emailList');
    
    if (filteredEmails.length === 0) {
        showEmptyState('No emails found');
        return;
    }
    
    container.innerHTML = filteredEmails.map((email, index) => {
        const isUnread = email.read_status === 0;
        const isStarred = email.starred === 1;
        const isSelected = selectedEmails.has(email.id);
        
        // Format sender - show name or email
        const senderDisplay = email.email ? email.email.split('@')[0] : 'Unknown';
        
        // Get clean preview text
        const preview = getCleanPreview(email);
        
        // Format date
        const dateStr = formatDate(email.timestamp);
        
        // Category color
        const categoryColor = getCategoryColor(email.category);
        
        return `
            <div class="email-row ${isUnread ? 'unread' : ''} ${isSelected ? 'selected' : ''}" 
                 data-id="${email.id}" 
                 onclick="selectEmail(${email.id})"
                 style="animation-delay: ${index * 20}ms">
                <div class="flex items-center space-x-3">
                    <input type="checkbox" 
                           class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                           onclick="event.stopPropagation(); toggleSelect(${email.id})"
                           ${isSelected ? 'checked' : ''}>
                    <button class="star-btn ${isStarred ? 'text-yellow-500' : 'text-gray-400'}"
                            onclick="event.stopPropagation(); toggleStar(${email.id})">
                        <svg class="w-5 h-5" fill="${isStarred ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                    </button>
                </div>
                <div class="email-sender ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}">
                    ${escapeHtml(senderDisplay)}
                </div>
                <div class="email-content">
                    <span class="email-subject ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}">
                        ${escapeHtml(email.subject || '(no subject)')}
                    </span>
                    <span class="email-preview"> - ${escapeHtml(preview)}</span>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="category-badge" style="background-color: ${categoryColor}15; color: ${categoryColor};">
                        ${escapeHtml(email.category)}
                    </span>
                    <span class="email-date">${dateStr}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Get clean text preview from email
function getCleanPreview(email) {
    let text = '';
    
    // Prefer plain text message
    if (email.message && !email.message.trim().startsWith('<')) {
        text = email.message;
    } else if (email.html_message) {
        text = stripHtml(email.html_message);
    } else if (email.message) {
        text = stripHtml(email.message);
    }
    
    // Clean up the text
    text = text
        .replace(/\s+/g, ' ')
        .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
        .replace(/[<>]/g, '')
        .trim();
    
    return text.substring(0, 100);
}

// Strip HTML tags and get clean text
function stripHtml(html) {
    if (!html) return '';
    
    // Remove style and script tags first
    let text = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');
    
    // Create element and get text content
    const div = document.createElement('div');
    div.innerHTML = text;
    
    // Get text and clean it up
    text = div.textContent || div.innerText || '';
    
    // Clean up whitespace and special characters
    text = text
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .trim();
    
    return text;
}

// Format date for display
function formatDate(date) {
    if (!date) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const emailDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (emailDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    } else if (emailDate.getTime() === today.getTime() - 86400000) {
        return 'Yesterday';
    } else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('nl-NL', { weekday: 'short' });
    } else {
        return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    }
}

// Get category color
function getCategoryColor(category) {
    const colors = {
        'Afspraak maken': '#1a73e8',
        'Spoedzorg': '#ea4335',
        'Behandeling informatie': '#34a853',
        'Tarieven': '#9334e6',
        'Verzekering': '#00897b',
        'Klacht': '#f9ab00',
        'Algemene vraag': '#5f6368'
    };
    return colors[category] || '#5f6368';
}

// Select email and show detail
function selectEmail(id) {
    selectedEmailId = id;
    const email = allEmails.find(e => e.id === id);
    if (email) {
        showEmailDetail(email);
        
        // Mark as read
        if (email.read_status === 0) {
            markAsRead(id);
        }
    }
}

// Show email detail panel
function showEmailDetail(email) {
    const panel = document.getElementById('emailDetailPanel');
    const content = document.getElementById('emailDetailContent');
    
    panel.classList.remove('hidden');
    
    const dateStr = email.timestamp.toLocaleDateString('nl-NL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Get email body content
    let bodyContent = '';
    const rawContent = email.html_message || email.message || '';
    
    // Check if content looks like HTML
    const isHtml = rawContent.includes('<html') || 
                   rawContent.includes('<body') || 
                   rawContent.includes('<div') ||
                   rawContent.includes('<table') ||
                   rawContent.includes('<p>');
    
    if (isHtml) {
        // Sanitize and display HTML
        const sanitized = sanitizeHtml(rawContent);
        bodyContent = `<div class="email-html-body">${sanitized}</div>`;
    } else {
        // Plain text - escape and preserve formatting
        bodyContent = `<div style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${escapeHtml(rawContent || 'No content')}</div>`;
    }
    
    content.innerHTML = `
        <div class="email-detail-header">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ${escapeHtml(email.subject || '(no subject)')}
            </h1>
            <div class="flex items-start space-x-3">
                <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    ${(email.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <span class="font-medium text-gray-900 dark:text-white">${escapeHtml(email.email || 'Unknown')}</span>
                        <span class="category-badge" style="background-color: ${getCategoryColor(email.category)}15; color: ${getCategoryColor(email.category)};">
                            ${escapeHtml(email.category)}
                        </span>
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">${dateStr}</div>
                </div>
                <button onclick="toggleStar(${email.id})" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full ${email.starred ? 'text-yellow-500' : 'text-gray-400'}">
                    <svg class="w-5 h-5" fill="${email.starred ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                </button>
            </div>
        </div>
        
        ${email.attachments && email.attachments.length > 0 ? `
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center space-x-2 mb-3">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                </svg>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${email.attachments.length} attachment${email.attachments.length > 1 ? 's' : ''}</span>
            </div>
            <div class="flex flex-wrap gap-2">
                ${email.attachments.map(att => `
                    <a href="/api/gmail/attachment/${email.gmail_id}/${att.attachmentId}" 
                       target="_blank"
                       class="inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
                        <span>${getFileIcon(att.mimeType)}</span>
                        <span class="text-gray-700 dark:text-gray-300">${escapeHtml(att.filename)}</span>
                    </a>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="email-detail-body">
            ${bodyContent}
        </div>
        
        <div class="p-6 border-t border-gray-200 dark:border-gray-700">
            <div class="flex space-x-3">
                ${email.source === 'email' && email.gmail_id ? `
                    <button onclick="replyToEmail(${email.id})" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                        Reply
                    </button>
                ` : `
                    <a href="mailto:${escapeHtml(email.email)}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                        Reply via Email
                    </a>
                `}
                <button onclick="archiveEmail(${email.id})" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium">
                    Archive
                </button>
            </div>
        </div>
    `;
}

// Close email detail panel
function closeEmailDetail() {
    document.getElementById('emailDetailPanel').classList.add('hidden');
    selectedEmailId = null;
}

// Show empty state
function showEmptyState(message) {
    document.getElementById('emailList').innerHTML = `
        <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div class="text-center">
                <svg class="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <p class="text-lg">${message}</p>
            </div>
        </div>
    `;
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sanitize HTML for safe display
function sanitizeHtml(html) {
    if (!html) return '';
    
    // First, remove style tags and their content completely (regex approach for embedded styles)
    let cleanHtml = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments
    
    // Create a temporary element
    const temp = document.createElement('div');
    temp.innerHTML = cleanHtml;
    
    // Remove any remaining dangerous elements
    const dangerous = temp.querySelectorAll('script, style, iframe, object, embed, form, meta, link, head');
    dangerous.forEach(el => el.remove());
    
    // Remove event handlers and dangerous attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on') || 
                attr.name === 'srcdoc' ||
                (attr.name === 'href' && attr.value.startsWith('javascript:'))) {
                el.removeAttribute(attr.name);
            }
        });
    });
    
    return temp.innerHTML;
}

// Get file icon based on mime type
function getFileIcon(mimeType) {
    if (!mimeType) return '📎';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    return '📎';
}

// Toggle email selection
function toggleSelect(id) {
    if (selectedEmails.has(id)) {
        selectedEmails.delete(id);
    } else {
        selectedEmails.add(id);
    }
    updateBulkActions();
    renderEmailList();
}

// Toggle star
async function toggleStar(id) {
    const email = allEmails.find(e => e.id === id);
    if (email) {
        email.starred = email.starred ? 0 : 1;
        renderEmailList();
        updateCounts();
        
        // If detail panel is open, refresh it
        if (selectedEmailId === id) {
            showEmailDetail(email);
        }
    }
}

// Mark as read
async function markAsRead(id) {
    const email = allEmails.find(e => e.id === id);
    if (email && email.read_status === 0) {
        email.read_status = 1;
        renderEmailList();
        updateCounts();
        
        // Call API to mark as read
        if (email.gmail_id) {
            try {
                await fetch('/api/gmail/mark-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gmailId: email.gmail_id })
                });
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }
    }
}

// Archive email
async function archiveEmail(id) {
    const email = allEmails.find(e => e.id === id);
    if (email && email.gmail_id) {
        try {
            await fetch('/api/gmail/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gmailId: email.gmail_id })
            });
            
            // Remove from list
            allEmails = allEmails.filter(e => e.id !== id);
            applyFilters();
            updateCounts();
            closeEmailDetail();
        } catch (error) {
            console.error('Error archiving:', error);
        }
    }
}

// Reply to email
function replyToEmail(id) {
    const email = allEmails.find(e => e.id === id);
    if (email) {
        // For now, open mailto
        window.location.href = `mailto:${email.email}?subject=Re: ${email.subject || ''}`;
    }
}

// Update bulk actions visibility
function updateBulkActions() {
    const bulkActions = document.getElementById('bulkActions');
    if (selectedEmails.size > 0) {
        bulkActions.classList.remove('hidden');
    } else {
        bulkActions.classList.add('hidden');
    }
}

// Bulk mark as read
function bulkMarkRead() {
    selectedEmails.forEach(id => markAsRead(id));
    selectedEmails.clear();
    updateBulkActions();
    renderEmailList();
}

// Bulk archive
function bulkArchive() {
    selectedEmails.forEach(id => archiveEmail(id));
    selectedEmails.clear();
    updateBulkActions();
}

// Sync emails
async function syncEmails() {
    const btn = document.getElementById('syncBtn');
    btn.disabled = true;
    btn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Syncing...</span>';
    
    try {
        const response = await fetch('/api/gmail/sync', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            await loadEmails();
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
    
    btn.disabled = false;
    btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg><span>Sync</span>';
}

// Check Gmail status
async function checkGmailStatus() {
    try {
        const response = await fetch('/api/gmail/status');
        const result = await response.json();
        
        const connectBtn = document.getElementById('connectGmailBtn');
        const connectedDiv = document.getElementById('gmailConnected');
        
        if (result.authenticated) {
            connectBtn?.classList.add('hidden');
            connectedDiv?.classList.remove('hidden');
        } else {
            connectBtn?.classList.remove('hidden');
            connectedDiv?.classList.add('hidden');
        }
    } catch (error) {
        console.error('Gmail status error:', error);
    }
}

// Connect Gmail
async function connectGmail() {
    try {
        const response = await fetch('/api/gmail/auth-url');
        const result = await response.json();
        
        if (result.url) {
            window.location.href = result.url;
        }
    } catch (error) {
        console.error('Gmail connect error:', error);
    }
}

// Folder click handlers
document.querySelectorAll('.folder-item[data-folder]').forEach(el => {
    el.addEventListener('click', () => {
        currentFolder = el.dataset.folder;
        currentCategory = null;
        
        // Update active state
        document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'));
        el.classList.add('active');
        
        applyFilters();
    });
});

// Category click handlers
document.querySelectorAll('.category-item').forEach(el => {
    el.addEventListener('click', () => {
        currentCategory = el.dataset.category;
        currentFolder = 'all';
        
        // Update active state
        document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'));
        el.classList.add('active');
        
        applyFilters();
    });
});

// Search handler
document.getElementById('searchInput')?.addEventListener('input', () => {
    applyFilters();
});

// Select all handler
document.getElementById('selectAll')?.addEventListener('change', (e) => {
    if (e.target.checked) {
        filteredEmails.forEach(email => selectedEmails.add(email.id));
    } else {
        selectedEmails.clear();
    }
    updateBulkActions();
    renderEmailList();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEmails();
    checkGmailStatus();
    
    // Refresh every 30 seconds
    setInterval(loadEmails, 30000);
});
