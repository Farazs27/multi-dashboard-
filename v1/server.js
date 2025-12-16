// Load environment variables from .env file if it exists
try {
    require('dotenv').config();
} catch (e) {
    // dotenv not installed, that's okay - use environment variables directly
}

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const GmailService = require('./gmail-service');
const GeminiService = require('./gemini-service');

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize services
const geminiService = new GeminiService();
const gmailService = new GmailService(geminiService);
let emailSyncInterval = null;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    if (req.path === '/api/submissions') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
});

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Initialize database
const dbPath = path.join(__dirname, 'dashboard.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        
        // Ensure schema has all required columns (migration)
        db.serialize(() => {
            // Check if table exists
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='submissions'", (err, row) => {
                if (err) {
                    console.error('Error checking table:', err.message);
                    return;
                }
                
                if (!row) {
                    // Create table with all columns
                    db.run(`CREATE TABLE submissions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT,
                        category TEXT,
                        message TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        source TEXT DEFAULT 'form',
                        thread_id TEXT,
                        message_id TEXT,
                        in_reply_to TEXT,
                        read_status INTEGER DEFAULT 0,
                        subject TEXT,
                        gmail_id TEXT,
                        starred INTEGER DEFAULT 0,
                        notes TEXT,
                        priority TEXT DEFAULT 'medium',
                        response_status TEXT DEFAULT 'pending',
                        html_message TEXT
                    )`, (err) => {
                        if (err) {
                            console.error('Error creating table:', err.message);
                        } else {
                            console.log('Created submissions table with all columns');
                        }
                    });
                } else {
                    // Table exists - add missing columns if needed
                    const columnsToAdd = [
                        { name: 'source', sql: "ALTER TABLE submissions ADD COLUMN source TEXT DEFAULT 'form'" },
                        { name: 'thread_id', sql: 'ALTER TABLE submissions ADD COLUMN thread_id TEXT' },
                        { name: 'message_id', sql: 'ALTER TABLE submissions ADD COLUMN message_id TEXT' },
                        { name: 'in_reply_to', sql: 'ALTER TABLE submissions ADD COLUMN in_reply_to TEXT' },
                        { name: 'read_status', sql: 'ALTER TABLE submissions ADD COLUMN read_status INTEGER DEFAULT 0' },
                        { name: 'subject', sql: 'ALTER TABLE submissions ADD COLUMN subject TEXT' },
                        { name: 'gmail_id', sql: 'ALTER TABLE submissions ADD COLUMN gmail_id TEXT' },
                        { name: 'starred', sql: 'ALTER TABLE submissions ADD COLUMN starred INTEGER DEFAULT 0' },
                        { name: 'notes', sql: 'ALTER TABLE submissions ADD COLUMN notes TEXT' },
                        { name: 'priority', sql: "ALTER TABLE submissions ADD COLUMN priority TEXT DEFAULT 'medium'" },
                        { name: 'response_status', sql: "ALTER TABLE submissions ADD COLUMN response_status TEXT DEFAULT 'pending'" }
                    ];
                    
                    // Check which columns exist
                    db.all("PRAGMA table_info(submissions)", (err, columns) => {
                        if (err) {
                            console.error('Error getting table info:', err.message);
                            return;
                        }
                        
                        const existingColumns = columns.map(col => col.name);
                        const columnsToAddFiltered = columnsToAdd.filter(({ name }) => !existingColumns.includes(name));
                        
                        if (columnsToAddFiltered.length === 0) {
                            console.log('Database schema is up to date - all columns exist');
                            return;
                        }
                        
                        let completedCount = 0;
                        let addedCount = 0;
                        const totalToAdd = columnsToAddFiltered.length;
                        
                        columnsToAddFiltered.forEach(({ name, sql }) => {
                            db.run(sql, (err) => {
                                completedCount++;
                                
                                if (err && !err.message.includes('duplicate column')) {
                                    console.error(`Error adding column ${name}:`, err.message);
                                } else if (!err) {
                                    addedCount++;
                                    console.log(`Added missing column: ${name}`);
                                }
                                
                                // Log completion only after all operations complete
                                if (completedCount === totalToAdd) {
                                    if (addedCount > 0) {
                                        console.log(`Database migration complete: added ${addedCount} column(s)`);
                                    } else {
                                        console.log('Database migration: no columns needed to be added');
                                    }
                                }
                            });
                        });
                    });
                }
            });
        });
    }
});

// API endpoint to receive form submissions
app.post('/api/submissions', (req, res) => {
    console.log('=== API Submission Request Received ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    
    const { email, category, message } = req.body;

    // Validate required fields
    if (!email || !category || !message) {
        console.log('Validation failed: Missing required fields');
        console.log('Email:', email, 'Category:', category, 'Message:', message);
        return res.status(400).json({
            success: false,
            error: 'Missing required fields. Email, category, and message are required.'
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid email format'
        });
    }

    // Insert submission into database
    const sql = `INSERT INTO submissions (email, category, message) VALUES (?, ?, ?)`;
    
    console.log('Attempting to insert into database:', { email, category, message: message.substring(0, 50) + '...' });
    
    db.run(sql, [email, category, message], function(err) {
        if (err) {
            console.error('Database error:', err.message);
            console.error('Error details:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to save submission to database'
            });
        }

        console.log('Successfully saved submission with ID:', this.lastID);
        console.log('=== API Submission Request Completed ===\n');
        
        res.status(201).json({
            success: true,
            message: 'Submission received successfully',
            id: this.lastID
        });
    });
});

// API endpoint to get submission statistics (must be before generic /api/submissions route)
app.get('/api/submissions/stats', (req, res) => {
    const queries = {
        total: `SELECT COUNT(*) as count FROM submissions`,
        today: `SELECT COUNT(*) as count FROM submissions WHERE DATE(timestamp) = DATE('now')`,
        byCategory: `SELECT category, COUNT(*) as count FROM submissions GROUP BY category ORDER BY count DESC`
    };

    db.get(queries.total, [], (err, totalResult) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Failed to get total submissions' });
        }

        db.get(queries.today, [], (err, todayResult) => {
            if (err) {
                return res.status(500).json({ success: false, error: 'Failed to get today submissions' });
            }

            db.all(queries.byCategory, [], (err, categoryResults) => {
                if (err) {
                    return res.status(500).json({ success: false, error: 'Failed to get category stats' });
                }

                res.json({
                    success: true,
                    data: {
                        total: totalResult.count,
                        today: todayResult.count,
                        byCategory: categoryResults
                    }
                });
            });
        });
    });
});

// API endpoint to get all submissions (optional - for admin/dashboard)
app.get('/api/submissions', (req, res) => {
    const { source } = req.query;
    let sql = `SELECT * FROM submissions`;
    const params = [];

    if (source) {
        sql += ` WHERE source = ?`;
        params.push(source);
    }

    sql += ` ORDER BY timestamp DESC`;
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve submissions'
            });
        }

        // Parse attachments JSON for each row
        const processedRows = rows.map(row => {
            if (row.notes) {
                try {
                    const parsed = JSON.parse(row.notes);
                    // Check if it's an attachments array
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].filename) {
                        row.attachments = parsed;
                        // Keep original notes if it's not attachments
                    } else if (typeof parsed === 'string') {
                        // Notes is a string, not attachments
                    }
                } catch (e) {
                    // notes is not JSON, keep as is
                }
            }
            return row;
        });

        res.json({
            success: true,
            data: processedRows
        });
    });
});

// API endpoint to get a single submission by ID
app.get('/api/submissions/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM submissions WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve submission'
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }

        // Parse attachments JSON if present
        if (row.notes) {
            try {
                const parsed = JSON.parse(row.notes);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].filename) {
                    row.attachments = parsed;
                }
            } catch (e) {
                // notes is not JSON, keep as is
            }
        }

        res.json({
            success: true,
            data: row
        });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gmail OAuth endpoints
app.get('/api/gmail/auth-url', (req, res) => {
    gmailService.initialize().then((initialized) => {
        if (!initialized) {
            return res.status(500).json({ 
                success: false, 
                error: 'Gmail credentials not found. Please follow GMAIL-SETUP.md to set up gmail-credentials.json'
            });
        }
        
        if (gmailService.isAuthenticated()) {
            return res.json({ success: true, authenticated: true });
        }
        
        try {
            const authUrl = gmailService.getAuthUrl();
            res.json({ success: true, authenticated: false, authUrl });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }).catch(err => {
        res.status(500).json({ success: false, error: err.message });
    });
});

app.get('/oauth2callback', async (req, res) => {
    const { code, error } = req.query;
    
    if (error) {
        return res.send(`
            <html>
            <head><title>Gmail Authentication Error</title></head>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                <h1 style="color: #dc2626;">Authentication Error</h1>
                <p>${error}</p>
                <p style="color: #666;">Please try again or check your Google Cloud Console settings.</p>
                <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
            </body>
            </html>
        `);
    }
    
    if (!code) {
        return res.send(`
            <html>
            <head><title>Gmail Authentication Error</title></head>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                <h1 style="color: #dc2626;">Error</h1>
                <p>No authorization code provided.</p>
                <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
            </body>
            </html>
        `);
    }

    try {
        const initialized = await gmailService.initialize();
        if (!initialized) {
            return res.send(`
                <html>
                <head><title>Gmail Authentication Error</title></head>
                <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                    <h1 style="color: #dc2626;">Setup Required</h1>
                    <p>Gmail credentials file not found. Please set up gmail-credentials.json first.</p>
                    <p style="color: #666;">See GMAIL-SETUP.md for instructions.</p>
                    <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
                </body>
                </html>
            `);
        }
        
        const success = await gmailService.getToken(code);
        
        if (success) {
            // Start email sync
            startEmailSync();
            res.send(`
                <html>
                <head><title>Gmail Authentication Success</title></head>
                <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f0f9ff;">
                    <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                        <div style="color: #10b981; font-size: 48px; margin-bottom: 20px;">✓</div>
                        <h1 style="color: #1f2937; margin-bottom: 10px;">Success!</h1>
                        <p style="color: #6b7280; margin-bottom: 30px;">Gmail authentication successful. Emails will sync automatically.</p>
                        <p style="color: #9ca3af; font-size: 14px;">This window will close automatically...</p>
                    </div>
                    <script>
                        setTimeout(() => {
                            window.opener?.postMessage('gmail-connected', '*');
                            window.close();
                        }, 2000);
                    </script>
                </body>
                </html>
            `);
        } else {
            res.send(`
                <html>
                <head><title>Gmail Authentication Error</title></head>
                <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                    <h1 style="color: #dc2626;">Error</h1>
                    <p>Failed to authenticate. Please try again.</p>
                    <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.send(`
            <html>
            <head><title>Gmail Authentication Error</title></head>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                <h1 style="color: #dc2626;">Error</h1>
                <p>${error.message}</p>
                <p style="color: #666; margin-top: 20px;">Check server logs for more details.</p>
                <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
            </body>
            </html>
        `);
    }
});

// Gmail sync endpoint
app.post('/api/gmail/sync', async (req, res) => {
    try {
        await gmailService.initialize();
        if (!gmailService.isAuthenticated()) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        // Always use AI categorization
        const result = await gmailService.syncEmails('is:unread OR (in:inbox newer_than:7d)', true);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send email reply
app.post('/api/gmail/reply', async (req, res) => {
    try {
        await gmailService.initialize();
        if (!gmailService.isAuthenticated()) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { to, subject, message, threadId, inReplyTo } = req.body;
        if (!to || !subject || !message) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const result = await gmailService.sendReply(to, subject, message, threadId, inReplyTo);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark email as read
app.post('/api/gmail/mark-read', async (req, res) => {
    try {
        await gmailService.initialize();
        if (!gmailService.isAuthenticated()) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { gmailId } = req.body;
        if (!gmailId) {
            return res.status(400).json({ success: false, error: 'Missing gmailId' });
        }

        const result = await gmailService.markAsRead(gmailId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Archive email
app.post('/api/gmail/archive', async (req, res) => {
    try {
        await gmailService.initialize();
        if (!gmailService.isAuthenticated()) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { gmailId } = req.body;
        if (!gmailId) {
            return res.status(400).json({ success: false, error: 'Missing gmailId' });
        }

        const result = await gmailService.archiveEmail(gmailId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Gmail authentication status
app.get('/api/gmail/status', async (req, res) => {
    try {
        const initialized = await gmailService.initialize();
        if (!initialized) {
            return res.json({ 
                success: false, 
                authenticated: false, 
                error: 'Gmail credentials file not found. Please set up gmail-credentials.json first. See GMAIL-SETUP.md for instructions.' 
            });
        }
        
        res.json({ 
            success: true, 
            authenticated: gmailService.isAuthenticated() 
        });
    } catch (error) {
        console.error('Gmail status check error:', error);
        res.json({ 
            success: false, 
            authenticated: false, 
            error: error.message 
        });
    }
});

// Disconnect Gmail (delete token)
app.post('/api/gmail/disconnect', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const tokenPath = path.join(__dirname, 'gmail-token.json');
        
        try {
            await fs.unlink(tokenPath);
            console.log('Gmail token deleted');
        } catch (err) {
            // File might not exist, that's okay
        }
        
        // Clear email sync interval
        if (emailSyncInterval) {
            clearInterval(emailSyncInterval);
            emailSyncInterval = null;
        }
        
        res.json({ success: true, message: 'Gmail disconnected successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start email sync function
function startEmailSync() {
    // Clear existing interval if any
    if (emailSyncInterval) {
        clearInterval(emailSyncInterval);
    }

    // Initial sync (always use AI)
    gmailService.initialize().then(() => {
        if (gmailService.isAuthenticated()) {
            console.log('Starting initial email sync with AI categorization...');
            gmailService.syncEmails('is:unread OR (in:inbox newer_than:7d)', true).catch(err => {
                console.error('Email sync error:', err);
            });
        }
    });

    // Sync every 5 minutes (always use AI)
    emailSyncInterval = setInterval(() => {
        gmailService.initialize().then(() => {
            if (gmailService.isAuthenticated()) {
                console.log('Starting scheduled email sync with AI categorization...');
                gmailService.syncEmails('is:unread OR (in:inbox newer_than:7d)', true).catch(err => {
                    console.error('Email sync error:', err);
                });
            }
        });
    }, 5 * 60 * 1000); // 5 minutes

    console.log('Email sync started (every 5 minutes)');
}

// Initialize Gmail service on startup
gmailService.initialize().then(() => {
    if (gmailService.isAuthenticated()) {
        console.log('Gmail service authenticated');
        startEmailSync();
    } else {
        console.log('Gmail service not authenticated. Use /api/gmail/auth-url to get auth URL');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Gemini AI categorization endpoint
app.post('/api/ai/categorize', async (req, res) => {
    try {
        const { email, subject, message } = req.body;
        
        if (!email || !message) {
            return res.status(400).json({ success: false, error: 'Email and message are required' });
        }

        const result = await geminiService.categorizeMessage(email, subject || '', message);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update submission with AI categorization
app.post('/api/submissions/:id/categorize', async (req, res) => {
    try {
        const { id } = req.params;
        const email = req.body.email || '';
        const subject = req.body.subject || '';
        const message = req.body.message || '';
        
        if (!email && !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email or message is required for categorization' 
            });
        }
        
        console.log(`[AI Categorize] Processing submission ${id}...`);
        const result = await geminiService.categorizeMessage(email, subject, message);
        console.log(`[AI Categorize] Result:`, result);

        db.run(
            `UPDATE submissions SET category = ?, priority = ? WHERE id = ?`,
            [result.category, result.urgency || 'medium', id],
            function(err) {
                if (err) {
                    console.error('[AI Categorize] Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Failed to update category in database' 
                    });
                }
                
                console.log(`[AI Categorize] Updated submission ${id}: category=${result.category}, priority=${result.urgency || 'medium'}`);
                res.json({ 
                    success: true, 
                    category: result.category, 
                    priority: result.urgency || 'medium',
                    urgency: result.urgency || 'medium' // Include both for compatibility
                });
            }
        );
    } catch (error) {
        console.error('[AI Categorize] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to categorize submission' 
        });
    }
});

// Update submission (star, notes, priority, response status)
app.patch('/api/submissions/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const allowedFields = ['starred', 'notes', 'priority', 'response_status', 'read_status'];
    const updateFields = [];
    const values = [];

    allowedFields.forEach(field => {
        if (updates.hasOwnProperty(field)) {
            updateFields.push(`${field} = ?`);
            values.push(updates[field]);
        }
    });

    if (updateFields.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    values.push(id);
    const sql = `UPDATE submissions SET ${updateFields.join(', ')} WHERE id = ?`;

    db.run(sql, values, function(err) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Failed to update submission' });
        }
        res.json({ success: true, message: 'Submission updated' });
    });
});

// Bulk update submissions
app.post('/api/submissions/bulk-update', (req, res) => {
    const { ids, updates } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'IDs array is required' });
    }

    const allowedFields = ['starred', 'priority', 'response_status', 'read_status'];
    const updateFields = [];
    const values = [];

    allowedFields.forEach(field => {
        if (updates.hasOwnProperty(field)) {
            updateFields.push(`${field} = ?`);
            values.push(updates[field]);
        }
    });

    if (updateFields.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    const placeholders = ids.map(() => '?').join(',');
    values.push(...ids);
    const sql = `UPDATE submissions SET ${updateFields.join(', ')} WHERE id IN (${placeholders})`;

    db.run(sql, values, function(err) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Failed to bulk update' });
        }
        res.json({ success: true, message: `${this.changes} submissions updated` });
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    if (emailSyncInterval) {
        clearInterval(emailSyncInterval);
    }
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});

