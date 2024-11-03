// server/services/user.service.js
import fs from 'fs'
import path from 'path'

const usersFilePath = path.join(path.resolve(), 'data/user.data.json')

// Helper to read user data
function _readUsers() {
    const data = fs.readFileSync(usersFilePath, 'utf-8')
    return JSON.parse(data)
}

// Helper to write user data
function _writeUsers(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2))
}

// Get user by username
function getUserByUsername(username) {
    const users = _readUsers()
    return users.find(user => user.username === username)
}

// Create a new user
function createUser({ username, password, address, phone }) {
    const users = _readUsers()
    const newUser = {
        id: 'u' + Math.floor(Math.random() * 10000),
        username,
        password,
        address,
        phone,
        purchasedToys: [],
        credits: 100
    }
    users.push(newUser)
    _writeUsers(users)
    return newUser
}

export const userService = {
    getUserByUsername,
    createUser
}
