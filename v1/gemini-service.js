let GoogleGenerativeAI;
try {
    const genAI = require('@google/generative-ai');
    GoogleGenerativeAI = genAI.GoogleGenerativeAI;
} catch (e) {
    console.warn('@google/generative-ai not installed. AI categorization will use fallback method.');
    GoogleGenerativeAI = null;
}

class GeminiService {
    constructor(apiKey) {
        // Load API key from environment variable or constructor parameter
        // Never hardcode API keys in source code
        this.apiKey = apiKey || process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            console.warn('GEMINI_API_KEY environment variable not set. AI categorization will use fallback method.');
        }
        this.genAI = null;
        
        if (this.apiKey && GoogleGenerativeAI) {
            try {
                this.genAI = new GoogleGenerativeAI(this.apiKey);
                console.log('✓ Gemini AI initialized successfully');
                console.log(`  API Key: ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
            } catch (error) {
                console.warn('✗ Failed to initialize Gemini AI:', error.message);
            }
        } else if (!this.apiKey) {
            console.warn('⚠ GEMINI_API_KEY not set. AI categorization will use fallback keyword matching.');
            console.warn('  Set GEMINI_API_KEY environment variable or pass API key to constructor.');
        } else if (!GoogleGenerativeAI) {
            console.warn('⚠ GoogleGenerativeAI class not available. Install @google/generative-ai package.');
        }
    }

    // Analyze message and categorize using AI
    async categorizeMessage(email, subject, message) {
        if (!this.genAI || !GoogleGenerativeAI) {
            console.log('[Gemini] Using fallback categorization (Gemini AI not available)');
            console.log('[Gemini] API Key set:', !!this.apiKey);
            console.log('[Gemini] GoogleGenerativeAI available:', !!GoogleGenerativeAI);
            return this.fallbackCategorize(subject, message);
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            
            // Use more of the message content for better analysis (up to 4000 characters)
            const fullMessage = (message || '').substring(0, 4000);
            
            const prompt = `You are an AI assistant for a Dutch dental practice (Mondzorg Sloterweg). Your task is to carefully read and analyze the ENTIRE email content, understand its meaning and intent, then categorize it accurately.

IMPORTANT: Read the FULL email content carefully. Analyze the actual meaning, not just keywords. Consider the context, tone, and what the sender is actually asking for or communicating.

Email Details:
From: ${email || 'Unknown'}
Subject: ${subject || 'No subject'}
Message Content:
${fullMessage || 'No message content'}

CATEGORIES (choose the MOST APPROPRIATE based on the email's actual content and intent):

1. "Afspraak maken" - The email is requesting, scheduling, rescheduling, or asking about an appointment or consultation. This includes:
   - Explicit appointment requests
   - Questions about availability
   - Rescheduling requests
   - Confirmation of appointments
   - Questions about consultation times

2. "Behandeling informatie" - The email is asking for information about specific treatments, procedures, or dental services. This includes:
   - Questions about specific treatments (implants, braces, cleaning, etc.)
   - Requests for treatment explanations
   - Information about procedures
   - Questions about what treatments are available

3. "Spoedzorg" - The email indicates an urgent dental issue or emergency situation. This includes:
   - Dental pain or emergencies
   - Urgent requests for immediate care
   - Acute dental problems
   - Emergency situations

4. "Tarieven" - The email is asking about prices, costs, or payment information. This includes:
   - Price inquiries
   - Cost questions
   - Payment method questions
   - Billing inquiries
   - Insurance coverage questions related to costs

5. "Verzekering" - The email is specifically about insurance coverage, claims, or insurance-related matters. This includes:
   - Insurance coverage questions
   - Insurance verification
   - Claim inquiries
   - Insurance policy questions

6. "Klacht" - The email contains a complaint, dissatisfaction, or negative feedback. This includes:
   - Complaints about service
   - Dissatisfaction with treatment
   - Issues or problems
   - Negative feedback

7. "Algemene vraag" - The email contains general questions, general information requests, or doesn't clearly fit into other categories. This includes:
   - General inquiries
   - Information requests
   - General questions about the practice
   - Miscellaneous questions

ANALYSIS STEPS:
1. Read the ENTIRE email content carefully
2. Understand the sender's intent and what they are actually asking for
3. Consider the context and tone
4. Match it to the MOST APPROPRIATE category based on meaning, not just keywords
5. Determine urgency level (low = not time-sensitive, medium = normal priority, high = urgent/emergency)

Respond with ONLY a valid JSON object (no markdown, no code blocks, just pure JSON):
{
  "category": "the most appropriate category name from the list above",
  "urgency": "low, medium, or high",
  "extracted_info": {
    "name": "extracted patient name if mentioned, or empty string",
    "phone": "extracted phone number if mentioned, or empty string",
    "key_points": ["main point 1 from the email", "main point 2", "main point 3"]
  },
  "suggested_response_template": "a brief, professional Dutch response template (2-3 sentences) appropriate for this email, or empty string if not needed"
}

Respond with ONLY valid JSON, no other text, no explanations, no markdown formatting.`;

            console.log('[Gemini] 🤖 Sending categorization request to Gemini Pro...');
            const startTime = Date.now();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            const duration = Date.now() - startTime;
            
            console.log(`[Gemini] ✓ Response received in ${duration}ms`);
            console.log('[Gemini] Raw response preview:', text.substring(0, 300));
            
            // Try to extract JSON from response (handle markdown code blocks, etc.)
            let jsonText = text.trim();
            
            // Remove markdown code blocks if present
            jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            jsonText = jsonText.trim();
            
            // Try to find JSON object (look for opening brace)
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    const category = parsed.category || 'Algemene vraag';
                    const urgency = parsed.urgency || 'medium';
                    
                    // Validate category is one of the expected values
                    const validCategories = [
                        'Afspraak maken', 'Behandeling informatie', 'Spoedzorg', 
                        'Tarieven', 'Verzekering', 'Klacht', 'Algemene vraag'
                    ];
                    const finalCategory = validCategories.includes(category) 
                        ? category 
                        : 'Algemene vraag';
                    
                    console.log('[Gemini] ✓ Parsed successfully');
                    console.log(`[Gemini] Category: ${finalCategory}`);
                    console.log(`[Gemini] Urgency: ${urgency}`);
                    if (parsed.extracted_info && parsed.extracted_info.key_points) {
                        console.log(`[Gemini] Key points: ${parsed.extracted_info.key_points.length} extracted`);
                    }
                    
                    return {
                        category: finalCategory,
                        urgency: urgency,
                        extractedInfo: parsed.extracted_info || {},
                        suggestedResponse: parsed.suggested_response_template || ''
                    };
                } catch (parseError) {
                    console.error('[Gemini] ✗ JSON parse error:', parseError.message);
                    console.error('[Gemini] Attempted to parse:', jsonMatch[0].substring(0, 200));
                    console.error('[Gemini] Falling back to keyword categorization');
                    return this.fallbackCategorize(subject, message);
                }
            }
            
            console.warn('[Gemini] ⚠ No JSON object found in response');
            console.warn('[Gemini] Response text:', text.substring(0, 300));
            console.warn('[Gemini] Falling back to keyword categorization');
            return this.fallbackCategorize(subject, message);
        } catch (error) {
            console.error('[Gemini] API error:', error.message);
            console.error('[Gemini] Error details:', error);
            return this.fallbackCategorize(subject, message);
        }
    }

    // Fallback categorization using keyword matching
    fallbackCategorize(subject, message) {
        const text = ((subject || '') + ' ' + (message || '')).toLowerCase();
        
        const categories = {
            'Afspraak maken': ['afspraak', 'appointment', 'consultatie', 'consultation', 'bezoek', 'visit'],
            'Behandeling informatie': ['behandeling', 'treatment', 'procedure', 'implant', 'invisalign', 'bleaching', 'kroon', 'brug'],
            'Spoedzorg': ['spoed', 'urgent', 'pijn', 'pain', 'noodgeval', 'emergency', 'acuut'],
            'Tarieven': ['prijs', 'price', 'tarief', 'kosten', 'cost'],
            'Verzekering': ['verzekering', 'insurance', 'dekking', 'coverage', 'claim'],
            'Klacht': ['klacht', 'complaint', 'probleem', 'problem', 'ontevreden', 'dissatisfied']
        };

        for (const [category, keywords] of Object.entries(categories)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    return {
                        category,
                        urgency: keyword === 'spoed' || keyword === 'urgent' || keyword === 'pijn' ? 'high' : 'medium',
                        extractedInfo: {},
                        suggestedResponse: ''
                    };
                }
            }
        }

        return {
            category: 'Algemene vraag',
            urgency: 'medium',
            extractedInfo: {},
            suggestedResponse: ''
        };
    }

    // Suggest response template
    async suggestResponse(email, subject, message, category) {
        if (!this.genAI) {
            return '';
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            
            const prompt = `Based on this email from a dental practice, suggest a professional Dutch response template:

Category: ${category}
From: ${email}
Subject: ${subject || 'No subject'}
Message: ${message.substring(0, 1500)}

Provide a brief, professional Dutch response template (2-3 sentences) that:
- Acknowledges their inquiry
- Provides helpful next steps
- Is warm and professional
- Is appropriate for a dental practice

Respond with ONLY the response text, no explanations.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error('Gemini response suggestion error:', error);
            return '';
        }
    }
}

module.exports = GeminiService;

