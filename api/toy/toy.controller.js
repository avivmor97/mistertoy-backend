import { toyService } from '../../services/toy.service.js';
import { logger } from '../../services/logger.service.js';

export async function getToys(req, res) {
  try {
    const filterBy = {
      txt: req.query.byName || '',
      status: req.query.inStock || null,
      labels: req.query.byLabel ? req.query.byLabel.split(',') : [],
    };

    const sortBy = req.query.sortBy ? { [req.query.sortBy]: 1 } : {};
    logger.debug('Getting Toys with filterBy:', filterBy);
    const toys = await toyService.query(filterBy, sortBy);
    res.json(toys);
  } catch (err) {
    logger.error('Failed to get toys', err);
    res.status(500).send({ err: 'Failed to get toys' });
  }
}

export async function getToyById(req, res) {
  try {
    const toyId = req.params.id;
    const toy = await toyService.getById(toyId);
    res.json(toy);
  } catch (err) {
    logger.error('Failed to get toy', err);
    res.status(500).send({ err: 'Failed to get toy' });
  }
}

export async function addToy(req, res) {
  const { loggedinUser } = req;
  try {
    const toy = req.body;
    toy.owner = loggedinUser;
    const addedToy = await toyService.add(toy);
    logger.debug('Toy added:', addedToy);
    res.json(addedToy);
  } catch (err) {
    logger.error('Failed to add toy', err);
    res.status(500).send({ err: 'Failed to add toy' });
  }
}

export async function updateToy(req, res) {
  try {
    const toy = req.body;
    const updatedToy = await toyService.update(toy);
    res.json(updatedToy);
  } catch (err) {
    logger.error('Failed to update toy', err);
    res.status(500).send({ err: 'Failed to update toy' });
  }
}

export async function removeToy(req, res) {
  try {
    const toyId = req.params.id;
    await toyService.remove(toyId);
    res.send({ msg: 'Toy removed successfully' });
  } catch (err) {
    logger.error('Failed to remove toy', err);
    res.status(500).send({ err: 'Failed to remove toy' });
  }
}

export async function addToyMsg(req, res) {
    const { loggedinUser } = req;
    const { _id, username } = loggedinUser;
    try {
        const toyId = req.params.id;
        const msg = {
            userId: _id,
            username: username,
            content: req.body.content, // Ensure you're using the correct field from the request body
            createdAt: new Date().toISOString(),
        };
        const savedMsg = await toyService.addToyMsg(toyId, msg);
        res.json(savedMsg);
    } catch (err) {
        logger.error('Failed to add toy message', err);
        res.status(500).send({ err: 'Failed to add toy message' });
    }
}


export async function removeToyMsg(req, res) {
  try {
    const toyId = req.params.id;
    const { msgId } = req.params;
    await toyService.removeToyMsg(toyId, msgId);
    res.send({ msg: 'Message removed successfully' });
  } catch (err) {
    logger.error('Failed to remove toy message', err);
    res.status(500).send({ err: 'Failed to remove toy message' });
  }
}
