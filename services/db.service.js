// server/services/db.service.js
import { MongoClient } from 'mongodb'
import { config } from '../config/index.js'
import { logger } from './logger.service.js'

export const dbService = {
    getCollection
}

let dbConn = null

async function getCollection(collectionName) {
    try {
        const db = await connect()
        return db.collection(collectionName)
    } catch (err) {
        logger.error('Failed to get MongoDB collection', err)
        throw err
    }
}

async function connect() {
    if (dbConn) return dbConn
    try {
        const client = new MongoClient(config.dbURL)
        await client.connect()
        dbConn = client.db(config.dbName)
        logger.info(`Connected to MongoDB: ${config.dbName}`)
        return dbConn
    } catch (err) {
        logger.error('Cannot connect to DB', err)
        throw err
    }
}
