const User = require('../models/user.model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')


const registerUser = async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim()
        const password = req.body.password?.trim()

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'all fields are required'
            })
        }

        const exists = await User.findOne({ email })
        if (exists) {
            return res.status(400).json({
                message: 'email already exists'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        })

         const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000

        })

         user.password = undefined

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user

        })
    } catch (error) {
        res.status(500).json({ message: 'server error', error: error.message })
    }
}


const login = async (req, res) => {
    try {
        const email = req.body.email?.trim()
        const password = req.body.password?.trim()

        if (!email || !password) {
            return res.status(400).json({
                message: 'please enter email or password'
            })
        }

        const user = await User.findOne({ email }).select('+password')

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000

        })

        user.password = undefined

        return res.status(200).json({
            message: "Login successful",
            user,
        })
    } catch (error) {
        return res.status(500).json({
            message: "Server Error",
            error: error.message,
        })
    }
}

const getMe = async (req, res) => {
    try {
        const user = req.user
        return res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        return res.status(500).json({
            message: 'server error',
            error: error.message
        })
    }
}

const logout = async (req, res) => {
    try {
        res.clearCookie('token')
        return res.status(200).json({
            success: true,
            message: 'user logged out successfully...'
        })
    } catch (error) {
        return res.status(500).json({
            message: 'server error',
            error: error.message
        })
    }
}

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmNewPassword } = req.body

        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                message: 'all feilds are required'
            })
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                message: "New password and confirm password do not match"
            })
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({
                message: "New password must be different from old password"
            })
        }

        const user = await User.findById(req.user._id).select('+password')

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        const isMatched = await bcrypt.compare(oldPassword, user.password)
        if (!isMatched) {
            return res.status(400).json({
                message: 'incorrect password'
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        user.password = hashedPassword

        await user.save()

        return res.status(200).json({
            success: true,
            message: 'password changed successfully...'
        })



    } catch (error) {
        return res.status(500).json({
            message: 'server error',
            error: error.message
        })
    }
}

const updateProfile = async (req, res) => {
    try {
        const name = req.body.name?.trim()
        const gender = req.body.gender?.trim()
        const mobile = req.body.mobile?.trim();

        if (!name && !gender && !mobile) {
            return res.status(400).json({
                message: "Please provide at least one field to update"
            })
        }
        if (gender && !["male", "female", "other"].includes(gender)) {
            return res.status(400).json({
                message: "Invalid gender"
            })
        }
        const user = req.user

        if (name) {
            user.name = name
        }

        if (gender) {
            user.gender = gender
        }

        if (mobile) {
            user.mobile = mobile
        }

        await user.save()

        return res.status(200).json({
            success: true,
            message: 'user updated successfully...',
            user
        })
    } catch (error) {
        return res.status(500).json({
            message: 'intrnal server error',
            error: error.message
        })
    }
}
module.exports = { registerUser, login, getMe, logout, changePassword, updateProfile }