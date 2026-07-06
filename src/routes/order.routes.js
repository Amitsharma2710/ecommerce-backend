const express = require('express')
const router = express.Router()

const protect = require('../middleware/auth.middleware')
const { placeOrder, getOrders, getOrderById, cancelOrder } = require('../controllers/orders.controller')



router.post('/', protect, placeOrder)

router.get('/', protect, getOrders)

router.get('/:id', protect, getOrderById)

router.delete('/:id', protect, cancelOrder)

module.exports = router