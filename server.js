import cors from 'cors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';

import { toyService } from './services/toy.service.js';
import { userService } from './services/user.service.js';
import { authRoutes } from './api/auth/auth.routes.js';
import { logger } from './services/logger.service.js';

const app = express();
const PORT = process.env.PORT || 3030;

// CORS Configuration
const corsOptions = {
    origin: [
        'http://127.0.0.1:8080',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'https://avivs-toy-shop.onrender.com'
    ],
    credentials: true
};

// Express Configuration
app.use(express.json());
app.use(cookieParser());  // Parse cookies for authentication
app.use(cors(corsOptions));

// Serve static files from the "public" directory
const publicPath = path.join(path.resolve(), 'public');
app.use(express.static(publicPath));

// Integrate auth routes
app.use('/api/auth', authRoutes);  // Authentication routes

// REST API for Toys
app.get('/api/toy', (req, res) => {
    const filterBy = {
        name: req.query.name || '',
        inStock: req.query.inStock || undefined,
        labels: Array.isArray(req.query.labels)
            ? req.query.labels
            : req.query.labels ? req.query.labels.split(',') : []
    };
    const pageIdx = parseInt(req.query.pageIdx) || 0;
    const pageSize = parseInt(req.query.pageSize) || 5;

    toyService.query(filterBy, {}, pageIdx, pageSize)
        .then(data => res.send(data))
        .catch(err => {
            logger.error('Cannot get toys', err);
            res.status(400).send('Cannot get toys');
        });
});

app.get('/api/toy/:toyId', (req, res) => {
    const { toyId } = req.params;
    toyService.getById(toyId)
        .then(toy => res.send(toy))
        .catch(err => {
            logger.error('Cannot get toy', err);
            res.status(400).send('Cannot get toy');
        });
});

app.post('/api/toy', (req, res) => {
    const toy = {
        name: req.body.name,
        price: +req.body.price,
        labels: req.body.labels,
        inStock: req.body.inStock
    };
    toyService.save(toy)
        .then(savedToy => res.send(savedToy))
        .catch(err => {
            logger.error('Cannot save toy', err);
            res.status(400).send('Cannot save toy');
        });
});

app.put('/api/toy/:toyId', (req, res) => {
    const toy = {
        _id: req.params.toyId,
        name: req.body.name,
        price: +req.body.price,
        labels: req.body.labels,
        inStock: req.body.inStock
    };
    toyService.save(toy)
        .then(savedToy => res.send(savedToy))
        .catch(err => {
            logger.error('Cannot update toy', err);
            res.status(400).send('Cannot update toy');
        });
});

app.delete('/api/toy/:toyId', (req, res) => {
    const { toyId } = req.params;
    toyService.remove(toyId)
        .then(() => res.send('Toy removed'))
        .catch(err => {
            logger.error('Cannot remove toy', err);
            res.status(400).send('Cannot remove toy');
        });
});

// Catch-all route to serve index.html for frontend paths
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
