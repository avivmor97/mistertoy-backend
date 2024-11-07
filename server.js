import cors from 'cors';
import express from 'express';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';

import { authRoutes } from './api/auth/auth.routes.js';
import { toyService } from './services/toy.service.js';
import { userRoutes } from './api/user/user.routes.js';
import { logger } from './services/logger.service.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'http://127.0.0.1:8080',
            'http://localhost:8080',
            'http://127.0.0.1:5173',
            'http://localhost:5173',
            'http://localhost:5174',
            'https://avivs-toy-shop.onrender.com'
        ],
        credentials: true,
    },
});

const PORT = process.env.PORT || 3030;

// CORS Configuration
const corsOptions = {
    origin: [
        'http://127.0.0.1:8080',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://localhost:5174',
        'https://avivs-toy-shop.onrender.com'
    ],
    credentials: true,
};

// Express Configuration
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// Serve static files from the "public" directory
const publicPath = path.join(path.resolve(), 'public');
app.use(express.static(publicPath));

// Integrate auth and user routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

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

app.post('/api/toy/:toyId/message', async (req, res) => {
    const { toyId } = req.params;
    const msg = req.body;

    if (!msg || !msg.content) {
        return res.status(400).send({ error: 'Message content is missing' });
    }
    try {
        const addedMsg = await toyService.addToyMsg(toyId, msg);
        res.send(addedMsg);
        io.to(toyId).emit('messageAdded', addedMsg); // Emit message addition to the room
    } catch (err) {
        console.error('Cannot add message to toy', err);
        res.status(400).send('Cannot add message');
    }
});

app.delete('/api/toy/:toyId/:msgId', async (req, res) => {
    const { toyId, msgId } = req.params;
    try {
        const updatedToy = await toyService.removeToyMsg(toyId, msgId);
        res.send(updatedToy);
        io.to(toyId).emit('messageRemoved', msgId); // Emit message removal to the room
    } catch (err) {
        console.error('Cannot remove message from toy', err);
        res.status(400).send('Cannot remove message');
    }
});

// Socket.IO for real-time chat
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinToyRoom', (toyId) => {
        socket.join(toyId);
        console.log(`Socket ${socket.id} joined toy room: ${toyId}`);
    });

    socket.on('leaveToyRoom', (toyId) => {
        socket.leave(toyId);
        console.log(`Socket ${socket.id} left toy room: ${toyId}`);
    });

    socket.on('sendMessage', (toyId, message) => {
        io.to(toyId).emit('receiveMessage', message); // Emit message to other clients in room
    });

    socket.on('typing', (toyId, username) => {
        socket.broadcast.to(toyId).emit('userTyping', `${username} is typing...`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Catch-all route to serve index.html for frontend paths
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
