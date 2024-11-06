import { dbService } from '../services/db.service.js';
import { logger } from '../services/logger.service.js';
import mongodb from 'mongodb';
const { ObjectId } = mongodb;

export const toyService = {
    query,
    getById,
    add,
    update,
    remove,
    addToyMsg,
    removeToyMsg,
};

async function query(filterBy = {}, sortBy = {}, pageIdx = 0, pageSize = 5) {
    try {
        const criteria = _buildCriteria(filterBy);
        const collection = await dbService.getCollection('toy');

        const totalToys = await collection.countDocuments(criteria);
        const toys = await collection.find(criteria)
            .sort(sortBy)
            .skip(pageIdx * pageSize)
            .limit(pageSize)
            .toArray();

        return { toys, totalToys };
    } catch (err) {
        logger.error('Cannot find toys', err);
        throw err;
    }
}

async function getById(toyId) {
    try {
        const collection = await dbService.getCollection('toy');
        const toy = await collection.findOne({ _id: new ObjectId(toyId) });
        if (!toy) throw new Error('Toy not found');
        return toy;
    } catch (err) {
        logger.error(`Failed to find toy with ID: ${toyId}`, err);
        throw err;
    }
}

async function add(toy) {
    try {
        const collection = await dbService.getCollection('toy');
        const newToy = {
            name: toy.name,
            price: toy.price,
            labels: toy.labels || [],
            inStock: toy.inStock !== undefined ? toy.inStock : true,
            createdAt: Date.now(),
            messages: []
        };
        const result = await collection.insertOne(newToy);
        return { ...newToy, _id: result.insertedId };
    } catch (err) {
        logger.error('Failed to add toy', err);
        throw err;
    }
}

async function update(toy) {
    try {
        const collection = await dbService.getCollection('toy');
        const toyToUpdate = {
            name: toy.name,
            price: toy.price,
            labels: toy.labels || [],
            inStock: toy.inStock,
        };
        await collection.updateOne(
            { _id: new ObjectId(toy._id) },
            { $set: toyToUpdate }
        );
        return { ...toyToUpdate, _id: toy._id };
    } catch (err) {
        logger.error(`Failed to update toy with ID: ${toy._id}`, err);
        throw err;
    }
}

async function remove(toyId) {
    try {
        const collection = await dbService.getCollection('toy');
        await collection.deleteOne({ _id: new ObjectId(toyId) });
    } catch (err) {
        logger.error(`Failed to remove toy with ID: ${toyId}`, err);
        throw err;
    }
}

async function addToyMsg(toyId, msg) {
    console.log('this is my log', toyId, msg);
    
    try {
        if (!msg) throw new Error('Message content is missing'); // Ensure msg is defined
        msg.id = new ObjectId().toString(); // Generate a unique ID for the message

        const collection = await dbService.getCollection('toy');
        await collection.updateOne(
            { _id: new ObjectId(toyId) },
            { $push: { messages: msg } }
        );

        return msg; // Return the added message
    } catch (err) {
        logger.error(`Failed to add message to toy with ID: ${toyId}`, err);
        throw err;
    }
}


async function removeToyMsg(toyId, msgId) {
    try {
        const collection = await dbService.getCollection('toy');
        await collection.updateOne(
            { _id: new ObjectId(toyId) },
            { $pull: { messages: { id: msgId } } } // Remove the message from the messages array
        );
        return msgId;
    } catch (err) {
        logger.error(`Failed to remove message from toy with ID: ${toyId}`, err);
        throw err;
    }
}

function _buildCriteria(filterBy) {
    const criteria = {};
    if (filterBy.name) {
        criteria.name = { $regex: filterBy.name, $options: 'i' };
    }
    if (filterBy.labels && filterBy.labels.length) {
        criteria.labels = { $in: filterBy.labels };
    }
    if (filterBy.inStock !== undefined) {
        criteria.inStock = filterBy.inStock === 'true' || filterBy.inStock === true;
    }
    return criteria;
}
