const Address = require('../models/address.model')
const Cart = require('../models/cart.model')

const validateAddress = async (userId, addressId) => {

    const existingAddress = await Address.findById(addressId)
    if (!existingAddress) {
        throw new Error('please add a valid address to continue the order...')
    }
    if (existingAddress.user.toString() !== userId) {
        throw new Error('unauthorised user')
    }

    return existingAddress
}

const validateCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId }).populate("items.product", "name price stock images")
    if (!cart) {
        throw new Error('cart not found')
    }

    if (cart.items.length === 0) {
        throw new Error('cart is empty')
    }

    return cart
}

const prepareOrderData = async (userId, addressId, paymentMethod) => {
    const existingAddress = await validateAddress(userId, addressId)

    const cart = await validateCart(userId)

    const validatedProducts = cart.items.map((item) => {
        const product = item.product

        if (!product) {
            throw new Error(`Product not found`)
        }

        if (product.stock < item.quantity) {
            throw new Error(
                `Only ${product.stock} items are available for ${product.name}`
            )
        }

        return { product, item }
    })

    const orderItems = validatedProducts.map(({ product, item }) => ({
        product: product._id,
        productName: product.name,
        image: product.images?.[0]?.url || "",
        price: product.price,
        quantity: item.quantity
    }))

    const subTotal = orderItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    )

    const shippingFee = subTotal >= 500 ? 0 : 50
    const discount = 0
    const tax = 0
    const totalAmount = subTotal + shippingFee + tax - discount

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

        paymentStatus: "Pending",

        orderStatus: "Pending"
    }

    return {
        orderData,
        validatedProducts,
        cart
    }
}

module.exports = { validateAddress, validateCart, prepareOrderData }