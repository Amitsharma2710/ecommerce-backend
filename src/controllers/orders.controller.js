const Product = require('../models/product.model')
const Order = require('../models/order.model')
const { validateCart, validateAddress, prepareOrderData } = require('../services/order.service')

const placeOrder = async (req, res) => {
    try {
        const userId = req.user.id
        const { addressId, paymentMethod } = req.body

        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: "Address id is required"
            })
        }

        const { orderData, validatedProducts, cart } = await prepareOrderData(userId, addressId, paymentMethod)



        if (paymentMethod === "COD") {
            const order = await Order.create(orderData)

            await Promise.all(
                validatedProducts.map(async ({ product, item }) => {
                    product.stock -= item.quantity
                    await product.save()
                })
            )

            cart.items = []
            await cart.save()

            return res.status(201).json({
                success: true,
                message: "Order placed successfully",
                order
            })
        }

        return res.status(400).json({
            success: false,
            message: "Invalid payment flow"
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
    }
}

const getOrders = async (req, res) => {
    try {
        const userId = req.user.id
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 })

        if (orders.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'no previous orders found',
                orders: []
            })
        }

        return res.status(200).json({
            success: true,
            message: 'orders fetched successfully....',
            orders
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'internal server error',
            error: error.message
        })
    }
}

const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id
        const order = await Order.findById(orderId)

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'order not found',
            })
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'unauthorised user'
            })
        }

        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            order
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'internal server error',
            error: error.message
        })
    }
}

const cancelOrder = async (req, res) => {
    try {
        const userId = req.user.id
        const orderId = req.params.id

        const order = await Order.findById(orderId)

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'order not found',
            })
        }

        if (order.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'unauthorised user'
            })
        }

        if (order.orderStatus === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'order already cancelled',
            })
        }

        if (["Shipped", "Delivered"].includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Order Cannot be Cancelled at this moment"
            })
        }

        await Promise.all(
            order.items.map(async (item) => {
                const product = await Product.findById(item.product)

                if (product) {
                    product.stock += item.quantity
                    await product.save()
                }
            })
        )

        order.orderStatus = 'Cancelled'
        await order.save()

        return res.status(200).json({
            success: true,
            message: 'order cancelled successfully....',
            order
        })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'internal server error',
            error: error.message
        })
    }
}


//admin

const getAllOrdersByAdmin = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit

        const orders = await Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email')

        const totalOrders = await Order.countDocuments()
        const totalPages = Math.ceil(totalOrders / limit)

        if (orders.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'no orders',
                orders: []
            })
        }


        return res.status(200).json({
            success: true,
            message: 'orders fetched successfully..',
            orders,

            pagination: {
                currentPage: page,
                totalPages,
                totalOrders,
                limit
            }
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'internal server error',
            error: error.message
        })
    }
}

const getOrderDetailsByAdmin = async (req, res) => {
    try {
        const orderId = req.params.id

        const order = await Order.findById(orderId).populate("user", "name email").populate("items.product", "name brand")

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'order not found',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'order details fetched successfully.',
            order
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'internal server error',
            error: error.message
        })
    }
}

const updateOrderStatusByAdmin = async (req, res) => {
    try {

        const orderId = req.params.id
        const { orderStatus } = req.body

        if (!orderStatus) {
            return res.status(400).json({
                success: false,
                message: "Order status is required"
            })
        }

        const allowedStatuses = [
            "Pending",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled"
        ]

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            })
        }

        const order = await Order.findById(orderId)

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'order not found'
            })
        }

        const nextStatus = {
            Pending: "Processing",
            Processing: "Shipped",
            Shipped: "Delivered",
            Delivered: null,
            Cancelled: null
        }

        const currentStatus = order.orderStatus

        if (nextStatus[currentStatus] !== orderStatus) {
            return res.status(400).json({
                success: false,
                message: `Order is already ${currentStatus} and cannot be updated`
            })
        }

        order.orderStatus = orderStatus
        await order.save()

        return res.status(200).json({
            success: true,
            message: 'order status changed successfully.',
            order
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'internal server error',
            error: error.message
        })
    }
}



module.exports = { placeOrder, getOrders, getOrderById, cancelOrder, getAllOrdersByAdmin, getOrderDetailsByAdmin, updateOrderStatusByAdmin }