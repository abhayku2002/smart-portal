const express = require('express');
const axios = require('axios');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const Joi = require('joi');

// Validation schemas
const createRequestSchema = Joi.object({
    title: Joi.string().required().min(3).max(200),
    description: Joi.string().required().min(10).max(2000),
    requesterName: Joi.string().required().min(2).max(100),
    requesterEmail: Joi.string().email().required(),
    category: Joi.string().valid('IT', 'Facilities', 'General').optional(),
    priority: Joi.string().valid('High', 'Low').optional()
});

const updateStatusSchema = Joi.object({
    status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED').required()
});

const app = express();
app.use(cors());
app.use(express.json());

// API Key Authentication Middleware
const API_KEY = process.env.API_KEY || 'dev-api-key-12345';

const requireApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }

    if (apiKey !== API_KEY) {
        return res.status(403).json({ error: 'Invalid API key' });
    }

    next();
};


let requests = [];
let idCounter = 1;

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Request Service API',
            version: '1.0.0',
            description: 'API for managing service requests',
        },
        servers: [
            { url: 'http://localhost:3002' }
        ],
    },
    apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const INTELLIGENCE_SERVICE_URL = process.env.INTELLIGENCE_SERVICE_URL || 'http://localhost:3003';

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a new request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               requesterName:
 *                 type: string
 *               requesterEmail:
 *                 type: string
 *               category:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
app.post('/api/requests', requireApiKey, async (req, res) => {
    // Validate input
    const { error, value } = createRequestSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details.map(d => d.message)
        });
    }

    const { title, description, requesterName, requesterEmail, category, priority } = value;

    try {
        let finalCategory = category;
        let finalPriority = priority;
        let sentiment = "Neutral";

        if (!finalCategory || !finalPriority) {
            try {
                const aiResponse = await axios.post(`${INTELLIGENCE_SERVICE_URL}/analyze`, {
                    title, description
                });
                if (!finalCategory) finalCategory = aiResponse.data.suggestedCategory;
                if (!finalPriority) finalPriority = aiResponse.data.suggestedPriority;
                sentiment = aiResponse.data.sentiment;
            } catch (error) {
                if (!finalCategory) finalCategory = "General";
                if (!finalPriority) finalPriority = "Low";
            }
        } else {
            try {
                const aiResponse = await axios.post(`${INTELLIGENCE_SERVICE_URL}/analyze`, {
                    title, description
                });
                sentiment = aiResponse.data.sentiment;
            } catch (error) {
                // AI service unavailable, continue with user values
            }
        }

        const newRequest = {
            id: idCounter++,
            title,
            description,
            requesterName,
            requesterEmail,
            category: finalCategory,
            priority: finalPriority,
            status: 'OPEN',
            aiNotes: sentiment,
            createdAt: new Date()
        };

        requests.push(newRequest);
        res.status(201).json(newRequest);
    } catch (err) {
        console.error('Error creating request:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get all requests
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of requests
 */
app.get('/api/requests', (req, res) => {
    const { category, status, priority, limit = '10', offset = '0' } = req.query;

    // Parse and validate pagination params
    const parsedLimit = Math.min(parseInt(limit) || 10, 100); // Max 100
    const parsedOffset = parseInt(offset) || 0;

    let filtered = requests;

    // Apply filters
    if (category) filtered = filtered.filter(r => r.category === category);
    if (status) filtered = filtered.filter(r => r.status === status);
    if (priority) filtered = filtered.filter(r => r.priority === priority);

    // Apply pagination
    const total = filtered.length;
    const paginatedResults = filtered.slice(parsedOffset, parsedOffset + parsedLimit);

    res.json({
        data: paginatedResults,
        metadata: {
            total,
            limit: parsedLimit,
            offset: parsedOffset,
            hasMore: parsedOffset + parsedLimit < total
        }
    });
});

app.patch('/api/requests/:id/status', requireApiKey, (req, res) => {
    // Validate input
    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details.map(d => d.message)
        });
    }

    const { status } = value;
    const requestId = parseInt(req.params.id);

    if (isNaN(requestId)) {
        return res.status(400).json({ error: 'Invalid request ID' });
    }

    const request = requests.find(r => r.id === requestId);
    if (!request) {
        return res.status(404).json({ error: 'Request not found' });
    }

    // Business rule: validate status transitions
    const validTransitions = {
        'OPEN': ['IN_PROGRESS', 'RESOLVED'],
        'IN_PROGRESS': ['RESOLVED', 'OPEN'],
        'RESOLVED': ['OPEN']
    };

    if (!validTransitions[request.status]?.includes(status)) {
        return res.status(422).json({
            error: 'Invalid status transition',
            details: `Cannot transition from ${request.status} to ${status}`
        });
    }

    request.status = status;
    request.updatedAt = new Date();
    res.json(request);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Request Service running on ${PORT}`));
