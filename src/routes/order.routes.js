const express = require('express')
const router = express.Router()
const admin = require('../middleware/admin.middleware')
const protect = require('../middleware/auth.middleware')
const { placeOrder, getOrders, getOrderById, cancelOrder, getAllOrdersByAdmin, getOrderDetailsByAdmin, updateOrderStatusByAdmin } = require('../controllers/orders.controller')



router.post('/', protect, placeOrder)


//admin

router.get('/admin', protect, admin, getAllOrdersByAdmin)

router.get('/admin/:id', protect, admin, getOrderDetailsByAdmin)

router.patch('/admin/:id/status', protect, admin, updateOrderStatusByAdmin)


//user

router.get('/', protect, getOrders)

router.get('/:id', protect, getOrderById)

router.patch('/:id', protect, cancelOrder)


module.exports = router