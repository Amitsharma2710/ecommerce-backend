const express = require("express")
const router = express.Router()
const protect = require("../middleware/auth.middleware")
const {createRazorpayOrder, verifyRazorpayPayment} = require("../controllers/payment.controller")


router.post("/create-order", protect, createRazorpayOrder)
router.post("/verify", protect, verifyRazorpayPayment)

module.exports = router

