// server/services/toy.service.js
import fs from 'fs'
import path from 'path'

const toysFilePath = path.join(path.resolve(), 'data/toy.json')

function _readToys() {
    const data = fs.readFileSync(toysFilePath, 'utf-8')
    return JSON.parse(data)
}

function _writeToys(toys) {
    fs.writeFileSync(toysFilePath, JSON.stringify(toys, null, 2))
}

function _generateId() {
    return 't' + Math.floor(Math.random() * 1000000)
}

export const toyService = {
    query(filterBy = {}, pageIdx = 0, pageSize = 5) {
        const toys = _readToys()
        let filteredToys = toys

        // Apply filters
        if (filterBy.name) {
            const regex = new RegExp(filterBy.name, 'i')
            filteredToys = filteredToys.filter(toy => regex.test(toy.name))
        }
        if (filterBy.inStock !== undefined) {
            const inStock = filterBy.inStock === 'true'
            filteredToys = filteredToys.filter(toy => toy.inStock === inStock)
        }
        if (filterBy.labels && filterBy.labels.length) {
            filteredToys = filteredToys.filter(toy =>
                filterBy.labels.every(label => toy.labels.includes(label))
            )
        }

        // Apply pagination
        const totalToys = filteredToys.length
        const paginatedToys = filteredToys.slice(pageIdx * pageSize, (pageIdx + 1) * pageSize)

        return Promise.resolve({ toys: paginatedToys, totalToys })
    },

    getById(toyId) {
        const toys = _readToys()
        const toy = toys.find(t => t._id === toyId)
        return toy ? Promise.resolve(toy) : Promise.reject('Toy not found')
    },

    save(toy) {
        const toys = _readToys()
        if (toy._id) {
            const idx = toys.findIndex(t => t._id === toy._id)
            if (idx === -1) return Promise.reject('Toy not found')
            toys[idx] = { ...toys[idx], ...toy }
        } else {
            toy._id = _generateId()
            toy.createdAt = Date.now()
            toys.push(toy)
        }
        _writeToys(toys)
        return Promise.resolve(toy)
    },

    remove(toyId) {
        const toys = _readToys()
        const idx = toys.findIndex(t => t._id === toyId)
        if (idx === -1) return Promise.reject('Toy not found')
        toys.splice(idx, 1)
        _writeToys(toys)
        return Promise.resolve()
    }
}
