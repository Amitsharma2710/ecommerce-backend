const Product = require('../models/product.model')
const Cart = require('../models/cart.model')
const Address = require('../models/address.model')
const Order = require('../models/order.model')

const placeOrder = async (req, res) => {
    try {
        const userId = req.user.id
        const { addressId, paymentMethod } = req.body

        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: 'address id is required'
            })
        }

        const existingAddress = await Address.findById(addressId)
        if (!existingAddress) {
            return res.status(404).json({
                success: false,
                message: 'please add a valid address to continue the order...'
            })
        }

        if (existingAddress.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'unauthorised user'
            })
        }

        const cart = await Cart.findOne({ user: userId })
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'cart not found'
            })
        }

        if (cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'cart is empty'
            })
        }

        const validatedProducts = await Promise.all(
            cart.items.map(async (item) => {
                const product = await Product.findById(item.product)
                if (!product) {
                    throw new Error(`Product ${item.product} not found`)
                }
                if (product.stock < item.quantity) {
                    throw new Error(`only ${product.stock} items are available for ${product.name}`)
                }

                return { product, item }
            })
        )


        const orderItems = validatedProducts.map(({ product, item }) => {
            return {
                product: product._id,
                productName: product.name,
                image: product.images?.[0]?.url || "",
                price: product.price,
                quantity: item.quantity
            }
        })

        const subTotal = orderItems.reduce((total, item) => {
            return total + (item.price * item.quantity)
        }, 0)


        const shippingFee = subTotal >= 500 ? 0 : 50
        const discount = 0
        const tax = 0
        const totalAmount = subTotal + shippingFee + tax - discount
        if (!["COD", "Razorpay"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            })
        }
        const orderData = {
            user: userId,
            items: orderItems,
            shippingAddress: {
                fullName: existingAddress.fullName,
                phone: existingAddress.phone,
                houseNo: existingAddress.houseNo,
                area: existingAddress.area,
                landmark: existingAddress.landmark,
                city: existingAddress.city,
                state: existingAddress.state,
                country: existingAddress.country,
                pincode: existingAddress.pincode
            },
            subTotal,
            shippingFee,
            discount,
            tax,
            totalAmount,
            paymentMethod,
            paymentStatus: 'Pending',
            orderStatus: 'Pending'

        }

        const order = await Order.create(orderData)

        if (paymentMethod === 'COD') {
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





    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'internal server error',
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

module.exports = {placeOrder, getOrders, getOrderById, cancelOrder}