const { google } = require('googleapis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class GmailService {
    constructor(geminiService = null) {
        this.oauth2Client = null;
        this.gmail = null;
        this.dbPath = path.join(__dirname, 'dashboard.db');
        this.tokenPath = path.join(__dirname, 'gmail-token.json');
        this.credentialsPath = path.join(__dirname, 'gmail-credentials.json');
        this.geminiService = geminiService; // Optional Gemini service for AI categorization
    }

    // Initialize OAuth2 client
    async initialize() {
        try {
            // Check if credentials file exists
            try {
                await fs.access(this.credentialsPath);
            } catch (err) {
                console.error('Gmail credentials file not found:', this.credentialsPath);
                console.error('Please follow GMAIL-SETUP.md to create gmail-credentials.json');
                return false;
            }

            // Load credentials
            const credentialsContent = await fs.readFile(this.credentialsPath, 'utf8');
            const credentials = JSON.parse(credentialsContent);
            const creds = credentials.installed || credentials.web;
            
            if (!creds || !creds.client_id || !creds.client_secret) {
                console.error('Invalid credentials file format');
                return false;
            }

            const { client_secret, client_id, redirect_uris } = creds;
            
            this.oauth2Client = new google.auth.OAuth2(
                client_id,
                client_secret,
                redirect_uris[0] || 'http://localhost:4000/oauth2callback'
            );

            // Load existing token
            try {
                const token = await fs.readFile(this.tokenPath, 'utf8');
                this.oauth2Client.setCredentials(JSON.parse(token));
            } catch (err) {
                console.log('No existing token found. Authentication required.');
            }

            this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
            return true;
        } catch (error) {
            console.error('Error initializing Gmail service:', error.message);
            return false;
        }
    }

    // Get authorization URL
    getAuthUrl() {
        const SCOPES = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify'
        ];

        if (!this.oauth2Client) {
            throw new Error('OAuth2 client not initialized. Please ensure gmail-credentials.json exists.');
        }

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent'
        });
    }

    // Exchange authorization code for tokens
    async getToken(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            
            // Save token for later use
            await fs.writeFile(this.tokenPath, JSON.stringify(tokens));
            console.log('Token stored successfully');
            return true;
        } catch (error) {
            console.error('Error retrieving access token:', error);
            return false;
        }
    }

    // Check if authenticated
    isAuthenticated() {
        return this.oauth2Client && this.oauth2Client.credentials && this.oauth2Client.credentials.access_token;
    }

    // Refresh token if needed
    async refreshTokenIfNeeded() {
        if (this.oauth2Client.credentials.expiry_date && 
            this.oauth2Client.credentials.expiry_date <= Date.now()) {
            try {
                const { credentials } = await this.oauth2Client.refreshAccessToken();
                this.oauth2Client.setCredentials(credentials);
                await fs.writeFile(this.tokenPath, JSON.stringify(credentials));
                console.log('Token refreshed successfully');
            } catch (error) {
                console.error('Error refreshing token:', error);
            }
        }
    }

    // Fetch emails from Gmail
    async fetchEmails(query = 'is:unread', maxResults = 50) {
        try {
            await this.refreshTokenIfNeeded();

            const response = await this.gmail.users.messages.list({
                userId: 'me',
                q: query,
                maxResults: maxResults
            });

            const messages = response.data.messages || [];
            const emailDetails = [];

            for (const message of messages) {
                try {
                    const email = await this.gmail.users.messages.get({
                        userId: 'me',
                        id: message.id,
                        format: 'full'
                    });

                    const emailData = this.parseEmail(email.data);
                    emailDetails.push(emailData);
                } catch (error) {
                    console.error(`Error fetching email ${message.id}:`, error.message);
                }
            }

            return emailDetails;
        } catch (error) {
            console.error('Error fetching emails:', error);
            throw error;
        }
    }

    // Parse email data
    parseEmail(email) {
        const headers = email.payload.headers;
        const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const from = getHeader('from');
        const to = getHeader('to');
        const subject = getHeader('subject');
        const date = getHeader('date');
        const messageId = getHeader('message-id');
        const inReplyTo = getHeader('in-reply-to');
        const threadId = email.threadId;

        // Extract email address from "Name <email@domain.com>"
        const extractEmail = (str) => {
            const match = str.match(/<(.+)>/);
            return match ? match[1] : str;
        };

        // Get email body (both HTML and plain text)
        const { textBody, htmlBody, attachments } = this.extractEmailBody(email.payload);

        return {
            gmail_id: email.id,
            thread_id: threadId,
            message_id: messageId,
            in_reply_to: inReplyTo,
            email: extractEmail(from),
            from_name: from.replace(/<.+>/, '').trim(),
            subject: subject,
            message: textBody, // Plain text version for search/compatibility
            html_message: htmlBody, // HTML version for rich display
            attachments: attachments, // Array of attachment info
            timestamp: new Date(date).toISOString(),
            read_status: email.labelIds?.includes('UNREAD') ? 0 : 1
        };
    }

    // Extract email body and attachments from payload
    extractEmailBody(payload) {
        let textBody = '';
        let htmlBody = '';
        const attachments = [];

        // Recursive function to process parts
        const processPart = (part) => {
            if (!part) return;

            // Handle attachments
            if (part.filename && part.body?.attachmentId) {
                attachments.push({
                    filename: part.filename,
                    mimeType: part.mimeType || 'application/octet-stream',
                    size: part.body.size || 0,
                    attachmentId: part.body.attachmentId
                });
            }

            // Handle body content
            if (part.mimeType === 'text/plain' && part.body?.data && !textBody) {
                textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.mimeType === 'text/html' && part.body?.data && !htmlBody) {
                htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
            }

            // Process nested parts (multipart messages)
            if (part.parts && Array.isArray(part.parts)) {
                part.parts.forEach(processPart);
            }
        };

        // Start processing
        if (payload.body?.data) {
            // Simple message without parts
            const content = Buffer.from(payload.body.data, 'base64').toString('utf-8');
            if (payload.mimeType === 'text/html') {
                htmlBody = content;
                // Strip HTML tags for plain text
                textBody = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
            } else {
                textBody = content;
            }
        } else if (payload.parts) {
            payload.parts.forEach(processPart);
        }

        // Fallback: if we have HTML but no text, create text version
        if (htmlBody && !textBody) {
            textBody = htmlBody
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
                .replace(/<[^>]*>/g, '') // Remove all HTML tags
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, ' ')
                .trim();
        }

        return {
            textBody: textBody.trim(),
            htmlBody: htmlBody.trim(),
            attachments: attachments
        };
    }

    // Categorize email based on content (with optional AI)
    async categorizeEmail(email, useAI = true) {
        // Use Gemini AI if available and requested
        if (useAI && this.geminiService) {
            try {
                console.log(`    [Gemini] Analyzing email content...`);
                // Use textBody first (cleaner), then fallback to message, then htmlBody stripped
                let emailText = email.textBody || email.message || '';
                
                // If we only have HTML, extract text from it
                if (!emailText && email.html_message) {
                    // Basic HTML stripping - remove tags but keep text
                    emailText = email.html_message
                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                        .replace(/<[^>]*>/g, ' ')
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/\s+/g, ' ')
                        .trim();
                }
                
                const emailSubject = email.subject || '';
                const emailFrom = email.email || email.from || '';
                
                console.log(`    [Gemini] From: ${emailFrom}`);
                console.log(`    [Gemini] Subject: ${emailSubject}`);
                console.log(`    [Gemini] Message length: ${emailText.length} characters`);
                console.log(`    [Gemini] Message preview: ${emailText.substring(0, 150)}...`);
                
                const result = await this.geminiService.categorizeMessage(
                    emailFrom,
                    emailSubject,
                    emailText
                );
                
                if (result && result.category) {
                    console.log(`    [Gemini] ✓ Categorized as: ${result.category}`);
                    if (result.urgency) {
                        console.log(`    [Gemini] Urgency: ${result.urgency}`);
                    }
                    return result.category;
                } else {
                    console.warn(`    [Gemini] ⚠ No category in result, using fallback`);
                }
            } catch (error) {
                console.error(`    [Gemini] ✗ AI categorization failed:`, error.message);
                console.error(`    [Gemini] Falling back to keyword-based categorization`);
                // Fall through to keyword-based categorization
            }
        }

        // Fallback to keyword-based categorization
        const subject = (email.subject || '').toLowerCase();
        const message = (email.message || '').toLowerCase();

        const categories = {
            'Afspraak maken': ['afspraak', 'appointment', 'consultatie', 'consultation', 'bezoek', 'visit'],
            'Behandeling informatie': ['behandeling', 'treatment', 'procedure', 'implant', 'invisalign', 'bleaching'],
            'Spoedzorg': ['spoed', 'urgent', 'pijn', 'pain', 'noodgeval', 'emergency'],
            'Tarieven': ['prijs', 'price', 'tarief', 'kosten', 'cost', 'verzekering', 'insurance'],
            'Klacht': ['klacht', 'complaint', 'probleem', 'problem', 'ontevreden'],
            'Verzekering': ['verzekering', 'insurance', 'dekking', 'coverage', 'claim'],
            'Algemene vraag': []
        };

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.length === 0) continue;
            for (const keyword of keywords) {
                if (subject.includes(keyword) || message.includes(keyword)) {
                    return category;
                }
            }
        }

        return 'Algemene vraag';
    }

    // Save email to database
    async saveEmailToDatabase(emailData, useAI = true) {
        const db = new sqlite3.Database(this.dbPath);
        let category;
        
        try {
            if (useAI && this.geminiService) {
                console.log(`  🤖 Using Gemini AI to categorize email: "${emailData.subject || 'No subject'}"`);
            } else if (useAI && !this.geminiService) {
                console.warn(`  ⚠ AI requested but Gemini service not available, using keyword fallback`);
            } else {
                console.log(`  📝 Using keyword-based categorization`);
            }
            
            category = await this.categorizeEmail(emailData, useAI);
            console.log(`  ✓ Category determined: ${category}`);
        } catch (error) {
            console.error(`  ✗ Categorization error:`, error.message);
            // If categorization fails, close DB and reject
            db.close((closeErr) => {
                if (closeErr) console.error('Error closing DB after categorization failure:', closeErr);
            });
            return Promise.reject(error);
        }
        
        return new Promise((resolve, reject) => {

            // Check if email already exists
            db.get(
                `SELECT id FROM submissions WHERE gmail_id = ?`,
                [emailData.gmail_id],
                (err, row) => {
                    if (err) {
                        db.close((closeErr) => {
                            if (closeErr) console.error('Error closing DB after SELECT error:', closeErr);
                        });
                        return reject(err);
                    }

                    if (row) {
                        // Update existing email
                        // Store attachments as JSON string in notes field (temporary until schema migration)
                        const attachmentsJson = emailData.attachments && emailData.attachments.length > 0 
                            ? JSON.stringify(emailData.attachments) 
                            : null;
                        
                        db.run(
                            `UPDATE submissions SET 
                                read_status = ?,
                                category = ?,
                                message = ?,
                                subject = ?,
                                notes = ?,
                                html_message = ?
                             WHERE gmail_id = ?`,
                            [
                                emailData.read_status, 
                                category, 
                                emailData.message || emailData.textBody || '', 
                                emailData.subject, 
                                attachmentsJson,
                                emailData.html_message || null,
                                emailData.gmail_id
                            ],
                            function(updateErr) {
                                db.close((closeErr) => {
                                    if (closeErr) console.error('Error closing DB after UPDATE:', closeErr);
                                });
                                if (updateErr) return reject(updateErr);
                                resolve({ id: row.id, updated: true });
                            }
                        );
                    } else {
                        // Insert new email
                        // Store attachments as JSON string in notes field (temporary until schema migration)
                        const attachmentsJson = emailData.attachments && emailData.attachments.length > 0 
                            ? JSON.stringify(emailData.attachments) 
                            : null;
                        
                        db.run(
                            `INSERT INTO submissions 
                            (email, category, message, timestamp, source, thread_id, message_id, in_reply_to, read_status, subject, gmail_id, notes, html_message)
                            VALUES (?, ?, ?, ?, 'email', ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                emailData.email,
                                category,
                                emailData.message || emailData.textBody || '',
                                emailData.timestamp,
                                emailData.thread_id,
                                emailData.message_id,
                                emailData.in_reply_to || null,
                                emailData.read_status,
                                emailData.subject,
                                emailData.gmail_id,
                                attachmentsJson, // Store attachments in notes field (temporary until schema migration)
                                emailData.html_message || null // Store HTML message content
                            ],
                            function(insertErr) {
                                db.close((closeErr) => {
                                    if (closeErr) console.error('Error closing DB after INSERT:', closeErr);
                                });
                                if (insertErr) return reject(insertErr);
                                resolve({ id: this.lastID, updated: false });
                            }
                        );
                    }
                }
            );
        });
    }

    // Sync emails (fetch and save to database)
    async syncEmails(query = 'is:unread OR (in:inbox newer_than:7d)', useAI = true) {
        try {
            console.log('Starting email sync...');
            console.log(`AI categorization: ${useAI ? 'ENABLED' : 'DISABLED'}`);
            if (useAI && this.geminiService) {
                console.log('✓ Gemini AI service available for categorization');
            } else if (useAI && !this.geminiService) {
                console.warn('⚠ AI categorization requested but Gemini service not available');
            }
            
            const emails = await this.fetchEmails(query, 100);
            console.log(`Fetched ${emails.length} emails`);

            const results = [];
            for (let i = 0; i < emails.length; i++) {
                const email = emails[i];
                try {
                    console.log(`[${i + 1}/${emails.length}] Processing email: ${email.subject || 'No subject'} from ${email.email}`);
                    const result = await this.saveEmailToDatabase(email, useAI);
                    results.push(result);
                    if (useAI && result.category) {
                        console.log(`  ✓ Categorized as: ${result.category}`);
                    }
                } catch (error) {
                    console.error(`Error saving email ${email.gmail_id}:`, error.message);
                }
            }

            console.log(`✓ Synced ${results.length} emails successfully`);
            return { success: true, count: results.length, results };
        } catch (error) {
            console.error('Error syncing emails:', error);
            return { success: false, error: error.message };
        }
    }

    // Send email reply
    async sendReply(to, subject, message, threadId = null, inReplyTo = null) {
        try {
            await this.refreshTokenIfNeeded();

            // Create email message
            const emailLines = [
                `To: ${to}`,
                `Subject: ${subject}`,
                'Content-Type: text/plain; charset=utf-8',
                ''
            ];

            if (inReplyTo) {
                emailLines.splice(2, 0, `In-Reply-To: ${inReplyTo}`);
                emailLines.splice(3, 0, `References: ${inReplyTo}`);
            }

            emailLines.push(message);

            const email = emailLines.join('\r\n');
            const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            const request = {
                userId: 'me',
                requestBody: {
                    raw: encodedEmail
                }
            };

            if (threadId) {
                request.requestBody.threadId = threadId;
            }

            const response = await this.gmail.users.messages.send(request);
            
            // Save sent email to database
            if (response.data.id) {
                const sentEmail = {
                    gmail_id: response.data.id,
                    thread_id: threadId || response.data.threadId,
                    message_id: response.data.id,
                    in_reply_to: inReplyTo,
                    email: to,
                    subject: subject,
                    message: message,
                    timestamp: new Date().toISOString(),
                    read_status: 1,
                    source: 'email'
                };

                await this.saveEmailToDatabase(sentEmail);
            }

            return { success: true, messageId: response.data.id };
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }

    // Mark email as read
    async markAsRead(gmailId) {
        try {
            await this.refreshTokenIfNeeded();
            
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: gmailId,
                requestBody: {
                    removeLabelIds: ['UNREAD']
                }
            });

            // Update database
            const db = new sqlite3.Database(this.dbPath);
            db.run(`UPDATE submissions SET read_status = 1 WHERE gmail_id = ?`, [gmailId], (err) => {
                db.close();
                if (err) console.error('Error updating read status in database:', err);
            });

            return { success: true };
        } catch (error) {
            console.error('Error marking email as read:', error);
            return { success: false, error: error.message };
        }
    }

    // Get attachment data
    async getAttachment(gmailId, attachmentId) {
        try {
            await this.refreshTokenIfNeeded();
            
            const response = await this.gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: gmailId,
                id: attachmentId
            });

            const data = response.data.data;
            return Buffer.from(data, 'base64');
        } catch (error) {
            console.error('Error fetching attachment:', error);
            throw error;
        }
    }

    // Archive email
    async archiveEmail(gmailId) {
        try {
            await this.refreshTokenIfNeeded();
            
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: gmailId,
                requestBody: {
                    removeLabelIds: ['INBOX']
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Error archiving email:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = GmailService;

