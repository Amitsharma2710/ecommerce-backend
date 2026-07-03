const express = require('express')
const healthRoutes = require('./routes/health.routes')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/auth.routes')
const categoryRoutes = require('./routes/category.routes')
const productRoutes = require('./routes/product.routes')
const cartRoutes = require('./routes/cart.routes')
const addressRoutes = require('./routes/address.routes')
const app = express()

app.use(express.json())
app.use(cookieParser())

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/address', addressRoutes)

module.exports = app