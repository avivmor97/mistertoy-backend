// server/middlewares/auth.middleware.js

import { logger } from '../services/logger.service.js'
import { authService } from '../api/auth/auth.service.js'

export async function requireAuth(req, res, next) {
  if (!req?.cookies?.loginToken) {
    return res.status(401).send('Not Authenticated')
  }

  const loggedinUser = authService.validateToken(req.cookies.loginToken)
  if (!loggedinUser) return res.status(401).send('Not Authenticated')

  req.loggedinUser = loggedinUser
  next()
}

export async function requireAdmin(req, res, next) {
  if (!req?.cookies?.loginToken) {
    return res.status(401).send('Not Authenticated')
  }

  const loggedinUser = authService.validateToken(req.cookies.loginToken)
  if (!loggedinUser || !loggedinUser.isAdmin) {
    logger.warn(`${loggedinUser?.fullname || 'Unknown user'} attempted to perform an admin action`)
    return res.status(403).send('Not Authorized')
  }

  req.loggedinUser = loggedinUser
  next()
}
