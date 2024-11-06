// server/services/user.service.js
import { dbService } from './db.service.js'
import { logger } from '../../mistertoy-backend/services/logger.service.js'
import mongodb from 'mongodb'
const { ObjectId } = mongodb

export const userService = {
    query,
    getById,
    getByUsername,
    remove,
    update,
    add,
}

// Query users based on filters
async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy)
    try {
        const collection = await dbService.getCollection('user')
        let users = await collection.find(criteria).toArray()
        users = users.map((user) => {
            delete user.password
            user.createdAt = ObjectId(user._id).getTimestamp()
            return user
        })
        return users
    } catch (err) {
        logger.error('Cannot find users', err)
        throw err
    }
}

// Get user by ID
async function getById(userId) {
    try {
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne({ _id: ObjectId(userId) })
        if (!user) throw new Error('User not found')
        delete user.password
        return user
    } catch (err) {
        logger.error(`Failed to find user by ID: ${userId}`, err)
        throw err
    }
}

// Get user by username
async function getByUsername(username) {
    try {
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne({ username })
        return user
    } catch (err) {
        logger.error(`Failed to find user by username: ${username}`, err)
        throw err
    }
}

// Remove user by ID
async function remove(userId) {
    try {
        const collection = await dbService.getCollection('user')
        await collection.deleteOne({ _id: ObjectId(userId) })
    } catch (err) {
        logger.error(`Cannot remove user ${userId}`, err)
        throw err
    }
}

// Update user data
async function update(user) {
    try {
        const userToSave = {
            fullname: user.fullname,
            score: user.score,
            address: user.address,
            phone: user.phone,
            credits: user.credits,
            purchasedToys: user.purchasedToys || [],
        }
        const collection = await dbService.getCollection('user')
        await collection.updateOne({ _id: ObjectId(user._id) }, { $set: userToSave })
        return { ...userToSave, _id: user._id }
    } catch (err) {
        logger.error(`Cannot update user ${user._id}`, err)
        throw err
    }
}

// Add a new user with extended properties
async function add({ username, password, fullname, address = '', phone = '' }) {
    try {
        const userToAdd = {
            username,
            password,
            fullname,
            address,
            phone,
            credits: 100,
            purchasedToys: [],
            isAdmin: false,
            createdAt: new Date(),
        }
        const collection = await dbService.getCollection('user')
        await collection.insertOne(userToAdd)
        return userToAdd
    } catch (err) {
        logger.error('Cannot add user', err)
        throw err
    }
}

// Build query criteria based on filters
function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.txt) {
        const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
        criteria.$or = [
            { username: txtCriteria },
            { fullname: txtCriteria },
        ]
    }
    if (filterBy.minBalance) {
        criteria.score = { $gte: filterBy.minBalance }
    }
    return criteria
}
