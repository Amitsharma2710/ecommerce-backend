const Address = require('../models/address.model')

const addAddress = async (req, res) => {
    try {

        const userId = req.user.id
        let isDefault = false
        const { fullName, phone, houseNo, area, landmark, city, state, country, pincode, addressType } = req.body
        if (!fullName || !phone || !houseNo || !area || !city || !state || !pincode || !addressType) {
            return res.status(400).json({
                success: false,
                message: 'please fill all mandatory feilds'
            })
        }
        const existingAddress = await Address.findOne({ userId })
        if (!existingAddress) {
            isDefault = true
        }


        const address = await Address.create({
            user: userId,
            fullName,
            phone,
            houseNo,
            area,
            landmark,
            city,
            state,
            country,
            pincode,
            addressType,
            isDefault

        })

        return res.status(201).json({
            success: true,
            message: 'address added successfully...',
            address
        })



    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        })
    }
}

const getAddresses = async (req, res) => {
    try {

        const userId = req.user.id
        const existingAddresses = await Address.find({ user: userId })
        if (existingAddresses.length == 0) {
            return res.status(404).json({
                success: true,
                message: 'no addresses found',
                addresses: []
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Addresses fetched successfully....',
            addresses: existingAddresses
        })



    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        })
    }
}

const updateAddress = async (req, res) => {
    try {

        const userId = req.user.id
        const addressId = req.params.id

        const { fullName, phone, houseNo, area, landmark, city, state, country, pincode, addressType } = req.body
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Nothing to update"
            })
        }

        const address = await Address.findById(addressId)
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'address not found',
            })
        }
        if (address.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'unauthorised user',
            })
        }

        address.fullName = fullName || address.fullName
        address.phone = phone || address.phone
        address.houseNo = houseNo || address.houseNo
        address.area = area || address.area
        address.landmark = landmark || address.landmark
        address.city = city || address.city
        address.state = state || address.state
        address.country = country || address.country
        address.pincode = pincode || address.pincode
        address.addressType = addressType || address.addressType

        await address.save()

        return res.status(200).json({
            success: true,
            message: 'address updated successfully...',
            address
        })





    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        })
    }
}

const deleteAddress = async (req, res) => {
    try {

        const userId = req.user.id
        const addressId = req.params.id
        const address = await Address.findById(addressId)
        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            })
        }
        if (address.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'unauthorised user',
            })
        }

        await address.deleteOne()

        return res.status(200).json({
            success: true,
            message: 'address deleted successfully...'
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        })
    }
}

module.exports = { addAddress, getAddresses, updateAddress, deleteAddress }