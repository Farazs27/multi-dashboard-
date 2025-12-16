// Gmail Integration Functions for Dashboard

let currentReplyEmail = null;
let currentThreadId = null;
let currentInReplyTo = null;

// Check Gmail authentication status
async function checkGmailStatus() {
    try {
        const response = await fetch('/api/gmail/status');
        const result = await response.json();
        
        const statusText = document.getElementById('gmailStatusText');
        const statusDescription = document.getElementById('gmailStatusDescription');
        const statusBadge = document.getElementById('gmailStatusBadge');
        const connectBtn = document.getElementById('connectGmailBtn');
        const syncBtn = document.getElementById('syncEmailsBtn');
        const disconnectBtn = document.getElementById('disconnectGmailBtn');
        const instructions = document.getElementById('gmailInstructions');
        
        if (result.authenticated) {
            statusText.textContent = 'Connected';
            statusDescription.textContent = 'Gmail is connected. Emails sync automatically every 5 minutes.';
            statusBadge.className = 'px-4 py-2 rounded-lg text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            connectBtn?.classList.add('hidden');
            disconnectBtn?.classList.remove('hidden');
            syncBtn?.classList.remove('hidden');
            instructions?.classList.add('hidden');
        } else {
            statusText.textContent = 'Not Connected';
            if (result.error && result.error.includes('credentials')) {
                statusDescription.textContent = 'Gmail credentials file not found. Please set up gmail-credentials.json first.';
            } else {
                statusDescription.textContent = 'Connect your Gmail account to sync emails automatically.';
            }
            statusBadge.className = 'px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
            connectBtn?.classList.remove('hidden');
            disconnectBtn?.classList.add('hidden');
            syncBtn?.classList.add('hidden');
            instructions?.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error checking Gmail status:', error);
        const statusText = document.getElementById('gmailStatusText');
        const statusDescription = document.getElementById('gmailStatusDescription');
        const statusBadge = document.getElementById('gmailStatusBadge');
        
        if (statusText) statusText.textContent = 'Error';
        if (statusDescription) statusDescription.textContent = 'Unable to check Gmail connection status. Check server logs.';
        if (statusBadge) statusBadge.className = 'px-4 py-2 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    }
}

// Connect Gmail
async function connectGmail() {
    const connectBtn = document.getElementById('connectGmailBtn');
    const originalText = connectBtn.innerHTML;
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<svg class="animate-spin w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Connecting...';
    
    try {
        const response = await fetch('/api/gmail/auth-url');
        const result = await response.json();
        
        if (!result.success) {
            // Show detailed error message
            const errorMsg = result.error || 'Unknown error';
            if (errorMsg.includes('credentials not found') || errorMsg.includes('gmail-credentials.json')) {
                alert('Gmail credentials file not found!\n\nPlease follow these steps:\n1. Go to Google Cloud Console\n2. Create OAuth 2.0 credentials\n3. Download as gmail-credentials.json\n4. Place it in the project root\n\nSee GMAIL-SETUP.md for detailed instructions.');
            } else {
                alert('Error: ' + errorMsg);
            }
            connectBtn.disabled = false;
            connectBtn.innerHTML = originalText;
            return;
        }
        
        if (result.authenticated) {
            alert('Gmail is already connected!');
            checkGmailStatus();
            connectBtn.disabled = false;
            connectBtn.innerHTML = originalText;
            return;
        }
        
        if (result.authUrl) {
            // Open auth window
            const authWindow = window.open(
                result.authUrl, 
                'Gmail Authentication',
                'width=600,height=700,left=' + (screen.width/2 - 300) + ',top=' + (screen.height/2 - 350)
            );
            
            if (!authWindow) {
                alert('Popup blocked! Please allow popups for this site and try again.');
                connectBtn.disabled = false;
                connectBtn.innerHTML = originalText;
                return;
            }
            
            // Monitor for window close
            const checkClosed = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkClosed);
                    // Check status after window closes
                    setTimeout(() => {
                        checkGmailStatus();
                        connectBtn.disabled = false;
                        connectBtn.innerHTML = originalText;
                    }, 2000);
                }
            }, 1000);
            
            // Also check status periodically in case window doesn't close properly
            setTimeout(() => {
                clearInterval(checkClosed);
                checkGmailStatus();
                connectBtn.disabled = false;
                connectBtn.innerHTML = originalText;
            }, 60000); // 60 second timeout
        }
    } catch (error) {
        console.error('Error connecting Gmail:', error);
        alert('Error connecting to Gmail:\n\n' + error.message + '\n\nPlease check:\n1. Server is running on port 4000\n2. Gmail credentials file exists\n3. Browser console for details');
        connectBtn.disabled = false;
        connectBtn.innerHTML = originalText;
    }
}

// Sync emails
async function syncEmails() {
    const syncBtn = document.getElementById('syncEmailsBtn');
    const originalText = syncBtn.textContent;
    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';
    
    try {
        const response = await fetch('/api/gmail/sync', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            alert(`Successfully synced ${result.count} emails!`);
            loadSubmissions();
            loadStatistics();
        } else {
            alert('Error syncing emails: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error syncing emails:', error);
        alert('Error syncing emails. Please try again.');
    } finally {
        syncBtn.disabled = false;
        syncBtn.textContent = originalText;
    }
}

// Show reply modal
function showReplyModal(submission) {
    currentReplyEmail = submission.email;
    currentThreadId = submission.thread_id || null;
    currentInReplyTo = submission.message_id || null;
    
    const subject = submission.subject || submission.category || 'Re: Your inquiry';
    const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
    
    document.getElementById('replyTo').value = submission.email;
    document.getElementById('replySubject').value = replySubject;
    document.getElementById('replyMessage').value = '\n\n---\n' + (submission.message || '').substring(0, 200);
    
    const modal = document.getElementById('replyModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Safe version that accepts submission ID and looks it up
function showReplyModalById(submissionId) {
    // Find submission in allSubmissions array (from dashboard.js)
    const submission = window.allSubmissions ? window.allSubmissions.find(s => s.id === submissionId) : null;
    if (!submission) {
        console.error('Submission not found:', submissionId);
        alert('Error: Could not find submission details');
        return;
    }
    showReplyModal(submission);
}

// Send reply
async function sendReply(event) {
    event.preventDefault();
    
    const to = document.getElementById('replyTo').value;
    const subject = document.getElementById('replySubject').value;
    const message = document.getElementById('replyMessage').value;
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
        const response = await fetch('/api/gmail/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to,
                subject,
                message,
                threadId: currentThreadId,
                inReplyTo: currentInReplyTo
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Reply sent successfully!');
            closeReplyModal();
            loadSubmissions();
        } else {
            alert('Error sending reply: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        alert('Error sending reply. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Close reply modal
function closeReplyModal() {
    const modal = document.getElementById('replyModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    currentReplyEmail = null;
    currentThreadId = null;
    currentInReplyTo = null;
}

// Mark email as read
async function markAsRead(gmailId) {
    try {
        const response = await fetch('/api/gmail/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gmailId })
        });
        
        const result = await response.json();
        if (result.success) {
            loadSubmissions();
        }
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

// Archive email
async function archiveEmail(gmailId) {
    if (!confirm('Are you sure you want to archive this email?')) return;
    
    try {
        const response = await fetch('/api/gmail/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gmailId })
        });
        
        const result = await response.json();
        if (result.success) {
            loadSubmissions();
        }
    } catch (error) {
        console.error('Error archiving email:', error);
    }
}

// Update renderTable to include Gmail actions
function enhanceRenderTable() {
    // This will be called after the table is rendered to add Gmail-specific buttons
    const rows = document.querySelectorAll('#submissionsTableBody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            // Check if this is an email submission
            const sourceCell = cells[0];
            const actionsCell = cells[cells.length - 1];
            
            if (sourceCell && actionsCell) {
                const source = sourceCell.textContent.trim();
                if (source === 'email' || source === '📧') {
                    // Find the submission data
                    const viewDetailsBtn = actionsCell.querySelector('button');
                    if (viewDetailsBtn) {
                        const onclick = viewDetailsBtn.getAttribute('onclick');
                        if (onclick) {
                            const match = onclick.match(/showDetails\((\d+)\)/);
                            if (match) {
                                const id = parseInt(match[1]);
                                const submission = allSubmissions.find(s => s.id === id);
                                
                                if (submission && submission.gmail_id) {
                                    // Add email-specific actions
                                    const actionDiv = document.createElement('div');
                                    actionDiv.className = 'flex space-x-2';
                                    
                                    if (submission.read_status === 0) {
                                        const markReadBtn = document.createElement('button');
                                        markReadBtn.textContent = 'Mark Read';
                                        markReadBtn.className = 'text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700';
                                        markReadBtn.onclick = () => markAsRead(submission.gmail_id);
                                        actionDiv.appendChild(markReadBtn);
                                    }
                                    
                                    const replyBtn = document.createElement('button');
                                    replyBtn.textContent = 'Reply';
                                    replyBtn.className = 'text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700';
                                    replyBtn.onclick = () => showReplyModal(submission);
                                    actionDiv.appendChild(replyBtn);
                                    
                                    const archiveBtn = document.createElement('button');
                                    archiveBtn.textContent = 'Archive';
                                    archiveBtn.className = 'text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700';
                                    archiveBtn.onclick = () => archiveEmail(submission.gmail_id);
                                    actionDiv.appendChild(archiveBtn);
                                    
                                    actionsCell.appendChild(actionDiv);
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

// Disconnect Gmail
async function disconnectGmail() {
    if (!confirm('Are you sure you want to disconnect Gmail? This will stop automatic email syncing.')) {
        return;
    }
    
    try {
        // Delete token file via API (we'll need to add this endpoint)
        const response = await fetch('/api/gmail/disconnect', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            alert('Gmail disconnected successfully.');
            checkGmailStatus();
            loadSubmissions(); // Refresh to remove email indicators
        } else {
            alert('Error disconnecting: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error disconnecting Gmail:', error);
        alert('Error disconnecting Gmail. You may need to manually delete gmail-token.json file.');
    }
}

// Initialize Gmail functionality
function initGmailIntegration() {
    // Check status on load
    checkGmailStatus();
    
    // Set up event listeners
    const connectBtn = document.getElementById('connectGmailBtn');
    const syncBtn = document.getElementById('syncEmailsBtn');
    const disconnectBtn = document.getElementById('disconnectGmailBtn');
    const replyForm = document.getElementById('replyForm');
    const closeReplyModalBtn = document.getElementById('closeReplyModal');
    const cancelReplyBtn = document.getElementById('cancelReply');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', connectGmail);
    }
    
    if (syncBtn) {
        syncBtn.addEventListener('click', syncEmails);
    }
    
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectGmail);
    }
    
    if (replyForm) {
        replyForm.addEventListener('submit', sendReply);
    }
    
    if (closeReplyModalBtn) {
        closeReplyModalBtn.addEventListener('click', closeReplyModal);
    }
    
    if (cancelReplyBtn) {
        cancelReplyBtn.addEventListener('click', closeReplyModal);
    }
    
    // Close reply modal on background click
    const replyModal = document.getElementById('replyModal');
    if (replyModal) {
        replyModal.addEventListener('click', (e) => {
            if (e.target.id === 'replyModal') {
                closeReplyModal();
            }
        });
    }
    
    // Auto-refresh status every 30 seconds
    setInterval(checkGmailStatus, 30000);
}

// Export functions for use in main dashboard.js
window.GmailIntegration = {
    checkGmailStatus,
    connectGmail,
    syncEmails,
    disconnectGmail,
    showReplyModal,
    showReplyModalById,
    markAsRead,
    archiveEmail,
    enhanceRenderTable,
    initGmailIntegration
};

