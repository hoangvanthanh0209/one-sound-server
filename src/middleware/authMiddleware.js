import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import dotenv from 'dotenv'

import { User } from '../models/index.js'

dotenv.config()

const protectUser = asyncHandler(async (req, res, next) => {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1]

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password -avatarCloudinaryId')

            next()
        } catch (err) {
            console.log(err)
            res.status(401)
            throw new Error('Không được ủy quyền')
        }
    }

    if (!token) {
        res.status(401)
        throw new Error('Không được ủy quyền, không token')
    }
})

const protectAdmin = asyncHandler(async (req, res, next) => {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1]

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            // Get user from the token
            const user = await User.findById(decoded.id).select('-password -avatarCloudinaryId -artistNameRef')

            if (user.role === process.env.ADMIN_ROLE) {
                req.user = user
                next()
            } else {
                res.status(401)
                throw new Error('Không được ủy quyền với tư cách quản trị viên')
            }
        } catch (err) {
            console.log(err)
            res.status(401)
            throw new Error(err.message || 'Không được ủy quyền')
        }
    }

    if (!token) {
        res.status(401)
        throw new Error('Không được ủy quyền, không token')
    }
})

const auth = {
    protectUser,
    protectAdmin,
}

export default auth
