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
        logger.error('Failed to get Mongo collection', err)
        throw err
    }
}

async function connect() {
    if (dbConn) return dbConn
    try {
        const client = await MongoClient.connect(config.dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
        const db = client.db(config.dbName)
        dbConn = db
        return db
    } catch (err) {
        logger.error('Cannot connect to DB', err)
        throw err
    }
}
