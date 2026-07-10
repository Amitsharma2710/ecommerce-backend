const razorpay = require('../config/razorpay')
const crypto = require('crypto')
const { validateCart, validateAddress, prepareOrderData } = require('../services/order.service')
const Order = require('../models/order.model')

const createRazorpayOrder = async (req, res) => {

    try {
        const { addressId } = req.body
        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: "Address id is required"
            })
        }
        const userId = req.user.id
        const cart = await validateCart(userId)
        await validateAddress(userId, addressId)


        const subTotal = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity)
        }, 0)



        const shippingFee = subTotal >= 500 ? 0 : 50

        const discount = 0

        const tax = 0

        const totalAmount = subTotal + shippingFee + tax - discount

        const options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        }

        const razorpayOrder = await razorpay.orders.create(options)

        if (!razorpayOrder) {
            return res.status(500).json({
                success: false,
                message: "Failed to create Razorpay order"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Razorpay order created successfully",
            razorpayOrder,
            addressId
        })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
    }

}


const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId } = req.body
        const body = `${razorpay_order_id}|${razorpay_payment_id}`

        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY).update(body).digest('hex')

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            })
        }

        const { orderData, validatedProducts, cart } = await prepareOrderData(req.user.id, addressId, "Razorpay")
        orderData.paymentStatus = "Paid"

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


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
    }
}

module.exports = { createRazorpayOrder, verifyRazorpayPayment }