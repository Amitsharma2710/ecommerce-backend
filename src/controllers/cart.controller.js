const Cart = require('../models/cart.model')
const Product = require('../models/product.model')


const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body
        const product = await Product.findById(productId)

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'product not found please try again..'
            })
        }

        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            })
        }
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items available in stock`
            })
        }

        const existingCart = await Cart.findOne({ user: req.user.id })
        if (existingCart) {
             
            const productAlreadyExist = existingCart.items.find((item) => item.product.toString() === productId)
            if (productAlreadyExist) {
                const newQuantity = quantity + productAlreadyExist.quantity
                if (product.stock < newQuantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Only ${product.stock} items available in stock`
                    })
                }
                productAlreadyExist.quantity = newQuantity

            }
            else {
                existingCart.items.push({
                    product: productId,
                    quantity: quantity
                })
            }

            await existingCart.save()


            return res.status(200).json({
                success: true,
                message: 'product added to cart successfully...',
                cart: existingCart
            })
        }

        const createNewCart = await Cart.create({
            user: req.user.id,
            items: [{
                product: productId,
                quantity
            }]


        })

        return res.status(201).json({
            success: true,
            message: 'product added to cart successfully...',
            cart: createNewCart
        })
    } catch (error) {
        return res.status(500).json({
            message: 'internal server error',
            error: error.message
        })
    }
}


const getCart = async (req, res) => {
    try {
        const existingCart = await Cart.findOne({ user: req.user.id })
        if (!existingCart) {
            return res.status(200).json({
                success: true,
                message: 'cart is empty',
                cart: {
                    items: []
                }
            })
        }

        await existingCart.populate('items.product', 'name price category images brand stock',)
        return res.status(200).json({
            success: true,
            message: 'cart items fetched successfully....',
            cart: existingCart
        })
    } catch (error) {
        return res.status(500).json({
            message: 'internal server error',
            error: error.message
        })
    }
}

const updateCart = async (req, res) => {
    try {
        const productId = req.params.id
        const { quantity } = req.body

        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            })
        }


        const existingCart = await Cart.findOne({ user: req.user.id })
        if (!existingCart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            })
        }



        const existingProduct = existingCart.items.find((item) => item.product.toString() === productId)
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in cart'
            })
        }
        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            })
        }
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items available in stock`
            })

        }

        existingProduct.quantity = quantity

        await existingCart.save()

        return res.status(200).json({
            success: true,
            message: 'Cart updated successfully',
            cart: existingCart
        })

    } catch (error) {
        return res.status(500).json({
            message: 'internal server error',
            error: error.message
        })
    }
}

const deleteItemFromCart = async (req, res) => {
    try {
        const productId = req.params.id
        const existingCart = await Cart.findOne({ user: req.user.id })
        if (!existingCart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            })
        }

        const existingProduct = existingCart.items.find((item) => item.product.toString() === productId)
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in cart'
            })
        }

        existingCart.items = existingCart.items.filter((item) => item.product.toString() !== productId)

        await existingCart.save()

        return res.status(200).json({
            success: true,
            message: 'Product removed from cart successfully',
            cart: existingCart
        })


    } catch (error) {
        return res.status(500).json({
            message: 'internal server error',
            error: error.message
        })
    }
}


const clearCart = async (req, res) => {
    try {
        const existingCart = await Cart.findOne({ user: req.user.id })
        if (!existingCart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            })
        }

        existingCart.items = []

        await existingCart.save()
        return res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            cart: existingCart
        })
    } catch (error) {
        return res.status(500).json({
            message: 'internal server error',
            error: error.message
        })
    }
}


module.exports = { addToCart, getCart, updateCart, deleteItemFromCart, clearCart }