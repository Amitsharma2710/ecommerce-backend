const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            product:
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },

            productName:
            {
                type: String,
                required: true
            },

            image:
            {
                type: String,
                required: true
            },

            price:
            {
                type: Number,
                required: true,
                min: 0
            },

            quantity:
            {
                type: Number,
                required: true,
                min: 1
            }
        }
    ],
    shippingAddress: {
        fullName: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },
        houseNo: {
            type: String,
            required: true
        },
        area: {
            type: String,
            required: true
        },
        landmark: {
            type: String,

        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        country: {
            type: String,
            default: 'India'
        },
        pincode: {
            type: String,
            required: true
        }
    },
    subTotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingFee: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Failed', 'Paid', 'Refunded'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Razorpay', 'Stripe'],
        default: 'COD'
    },


}, { timestamps: true })

const Order = mongoose.model('Order', orderSchema)
module.exports = Order