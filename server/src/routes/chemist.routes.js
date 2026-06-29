const express = require('express');
const router = express.Router();
const {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  checkAvailability,
} = require('../controllers/chemist.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(authenticate);
router.use(authorize('chemist'));

router.get('/inventory', getInventory);
router.post('/inventory', addInventoryItem);
router.put('/inventory/:id', updateInventoryItem);
router.delete('/inventory/:id', deleteInventoryItem);
router.post('/check-availability', checkAvailability);

module.exports = router;
