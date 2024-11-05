import cors from 'cors'
import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'

import { authRoutes } from './api/auth/auth.routes.js'
import { toyRoutes } from './api/toy/toy.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { log } from './middlewares/logger.middleware.js'
import { logger } from './services/logger.service.js'

const app = express()
const PORT = process.env.PORT || 3030

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
}

// Express Configuration
app.use(express.json())
app.use(cookieParser())  // Parse cookies for authentication
app.use(cors(corsOptions))
app.use(log) // Custom logging middleware

// Serve static files from the "public" directory
const publicPath = path.join(path.resolve(), 'public')
app.use(express.static(publicPath))

// Routes
app.use('/api/auth', authRoutes) // Authentication routes
app.use('/api/toy', toyRoutes)   // Toy routes
app.use('/api/user', userRoutes) // User routes

// Catch-all route to serve index.html for frontend paths
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'))
})

// Error handling for unhandled routes or errors
app.use((err, req, res, next) => {
    logger.error('Unhandled Error:', err)
    res.status(500).send({ error: 'Something went wrong' })
})

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
