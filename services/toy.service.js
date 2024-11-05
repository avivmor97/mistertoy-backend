// server/services/toy.service.js
import { dbService } from '../services/db.service.js'
import { logger } from '../services/logger.service.js'
import mongodb from 'mongodb'
const { ObjectId } = mongodb

export const toyService = {
    query,
    getById,
    add,
    update,
    remove,
    addToyMsg,
    removeToyMsg,
}

// Query function with filtering and pagination
async function query(filterBy = {}, sortBy = {}, pageIdx = 0, pageSize = 5) {
    try {
        const criteria = _buildCriteria(filterBy);
        const collection = await dbService.getCollection('toy');
        
        // Log pagination details
        console.log(`Pagination - pageIdx: ${pageIdx}, pageSize: ${pageSize}`);
        console.log(`Skip value: ${pageIdx * pageSize}, Limit value: ${pageSize}`);

        // Fetch the total count of matching toys for pagination
        const totalToys = await collection.countDocuments(criteria);
        
        // Fetch toys with filtering, sorting, and pagination
        const toys = await collection.find(criteria)
            .sort(sortBy)
            .skip(pageIdx * pageSize)  // Skips records based on the current page
            .limit(pageSize)            // Limits the number of records per page
            .toArray();
        
       
        return { toys, totalToys };
    } catch (err) {
        logger.error('Cannot find toys', err);
        throw err;
    }
}



// Get toy by ID
async function getById(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        const toy = await collection.findOne({ _id: ObjectId(toyId) })
        if (!toy) throw new Error('Toy not found')
        return toy
    } catch (err) {
        logger.error(`Failed to find toy with ID: ${toyId}`, err)
        throw err
    }
}

// Add a new toy
async function add(toy) {
    try {
        const collection = await dbService.getCollection('toy')
        const newToy = {
            name: toy.name,
            price: toy.price,
            labels: toy.labels || [],
            inStock: toy.inStock !== undefined ? toy.inStock : true,
            createdAt: Date.now(),
            messages: []
        }
        const result = await collection.insertOne(newToy)
        return { ...newToy, _id: result.insertedId }
    } catch (err) {
        logger.error('Failed to add toy', err)
        throw err
    }
}

// Update an existing toy
async function update(toy) {
    try {
        const collection = await dbService.getCollection('toy')
        const toyToUpdate = {
            name: toy.name,
            price: toy.price,
            labels: toy.labels || [],
            inStock: toy.inStock,
        }
        await collection.updateOne(
            { _id: ObjectId(toy._id) },
            { $set: toyToUpdate }
        )
        return { ...toyToUpdate, _id: toy._id }
    } catch (err) {
        logger.error(`Failed to update toy with ID: ${toy._id}`, err)
        throw err
    }
}

// Remove a toy by ID
async function remove(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.deleteOne({ _id: ObjectId(toyId) })
    } catch (err) {
        logger.error(`Failed to remove toy with ID: ${toyId}`, err)
        throw err
    }
}

// Add a message to a toy
async function addToyMsg(toyId, msg) {
    try {
        msg.id = ObjectId().toString()  // Unique ID for the message
        const collection = await dbService.getCollection('toy')
        await collection.updateOne(
            { _id: ObjectId(toyId) },
            { $push: { messages: msg } }
        )
        return msg
    } catch (err) {
        logger.error(`Failed to add message to toy with ID: ${toyId}`, err)
        throw err
    }
}

// Remove a message from a toy
async function removeToyMsg(toyId, msgId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.updateOne(
            { _id: ObjectId(toyId) },
            { $pull: { messages: { id: msgId } } }
        )
        return msgId
    } catch (err) {
        logger.error(`Failed to remove message from toy with ID: ${toyId}`, err)
        throw err
    }
}

// Helper function to build MongoDB query criteria
function _buildCriteria(filterBy) {
    const criteria = {};

    // Filter by name (if provided)
    if (filterBy.name) {
        criteria.name = { $regex: filterBy.name, $options: 'i' };
    }

    // Filter by labels (if provided)
    if (filterBy.labels && filterBy.labels.length) {
        criteria.labels = { $in: filterBy.labels };
    }

    // Properly handle the inStock filter
    if (filterBy.inStock !== undefined) {
        // Explicitly convert filterBy.inStock to a boolean
        criteria.inStock = filterBy.inStock === 'true' || filterBy.inStock === true;
    }

    return criteria;
}

