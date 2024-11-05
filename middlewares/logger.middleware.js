// server/middlewares/log.middleware.js

import { logger } from '../services/logger.service.js'

export async function log(req, res, next) {
  logger.info('Request was made to:', req.originalUrl)
  next()
}
