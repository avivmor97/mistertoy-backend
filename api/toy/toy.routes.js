import express from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js';
import { log } from '../../middlewares/logger.middleware.js';
import {
  getToys,
  getToyById,
  addToy,
  updateToy,
  removeToy,
  addToyMsg,
  removeToyMsg,
} from '../toy/toy.controller.js';

export const toyRoutes = express.Router();

toyRoutes.get('/', log, getToys);
toyRoutes.get('/:id', getToyById);
toyRoutes.post('/', requireAdmin, addToy);
toyRoutes.put('/:id', requireAdmin, updateToy);
toyRoutes.delete('/:id', requireAdmin, removeToy);
toyRoutes.post('/:toyId/:msg', requireAuth, addToyMsg); // Route for adding messages
toyRoutes.delete('/:toyId/:msg:msgId', requireAuth, removeToyMsg); // Route for removing messages
