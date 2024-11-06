import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'

import { userService } from '../../services/user.service.js'
import { logger } from '../../services/logger.service.js'

const cryptr = new Cryptr(process.env.SECRET1 || 'Secret-Puk-1234')

export const authService = {
  signup,
  login,
  getLoginToken,
  validateToken,
}

async function login(username, password) {
    logger.debug(`auth.service - login with username: ${username}`)
    try {
        const user = await userService.getByUsername(username)
        if (!user) {
            logger.warn(`auth.service - No user found with username: ${username}`)
            return Promise.reject('Invalid username or password')
        }
        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            logger.warn(`auth.service - Invalid password attempt for username: ${username}`)
            return Promise.reject('Invalid username or password')
        }
        delete user.password
        logger.debug(`auth.service - User logged in successfully: ${JSON.stringify(user)}`)
        return user
    } catch (err) {
        logger.error('Error during login:', err)
        return Promise.reject('Failed to login due to a server error')
    }
}


export async function signup({ username, password, fullname, address, phone }) {
 
  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = {
      username,
      password: hashedPassword,
      fullname,
      address,
      phone,
      credits: 1000,
      isAdmin: false
  }

  // Save the new user via userService
  const account = await userService.add(newUser)
  if (!account) throw new Error('Account creation failed')
  logger.debug('New account created: ', account)
  return account
}

function getLoginToken(user) {
  const userInfo = {
    _id: user._id,
    fullname: user.fullname,
    isAdmin: user.isAdmin,
  }
  return cryptr.encrypt(JSON.stringify(userInfo))
}

function validateToken(loginToken) {
  try {
    const json = cryptr.decrypt(loginToken)
    const loggedinUser = JSON.parse(json)
    return loggedinUser
  } catch (err) {
    console.log('Invalid login token')
  }
  return null
}

