import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import asyncHandler from 'express-async-handler'
import slugtify from 'slugify'

import { User } from '../models/index.js'
import { uploadImage } from '../utils/cloundinary.js'

dotenv.config()

const slugifyOptions = {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: false,
    locale: 'vi',
    trim: true,
}

const slugifyOptionsSearch = {
    replacement: ' ',
    remove: undefined,
    lower: true,
    strict: false,
    locale: 'vi',
    trim: true,
}

const project = {
    $project: {
        _id: 0,
        id: '$_id',
        name: '$name',
        slug: '$slug',
        artistName: '$artistName',
        avatar: '$avatar',
        description: '$description',
        likeCount: '$likeCount',
    },
}

// @desc    Get user list
// @route   GET /api/users
// @access  Private (admin)
const getUserList = asyncHandler(async (req, res) => {
    const userList = await User.find().select(process.env.USER_INFO_ADMIN).sort({ role: 'asc', name: 'desc' })

    res.status(200).json(userList)
})

// @desc    Get users for page
// @route   GET /api/users/get?page=x&limit=x&name=x&typeSort=x
// @access  Public
const getUsers = asyncHandler(async (req, res) => {
    const { page, limit, name = '', typeSort } = req.query
    const pageNum = +page,
        limitNum = +limit
    let users = []
    let pagination

    const match = {
        $match: {
            search: { $regex: name, $options: 'i' },
            role: process.env.USER_ROLE,
        },
    }

    let sort
    if (typeSort) {
        sort = {
            $sort: {
                likeCount: typeSort === 'asc' ? 1 : -1,
                name: 1,
            },
        }
    } else {
        sort = {
            $sort: {
                name: 1,
            },
        }
    }

    if (limitNum) {
        const start = (pageNum - 1) * limitNum

        const skip = {
            $skip: start,
        }
        const limitCond = {
            $limit: limitNum,
        }

        const count = await User.find({
            search: { $regex: name, $options: 'i' },
            role: process.env.USER_ROLE,
        })
            .select(process.env.USER_INFO)
            .count()

        await User.aggregate([match, project, skip, limitCond, sort])
            .exec()
            .then((data) => {
                users = data
            })
            .catch((error) => {
                console.log(error)
                res.status(400)
                throw new Error('Có lỗi xảy ra')
            })

        pagination = {
            page: pageNum || 1,
            limit: limitNum,
            totalRows: users.length ? count : 0,
        }
    } else {
        await User.aggregate([match, sort, project])
            .exec()
            .then((data) => {
                users = data
            })
            .catch((error) => {
                console.log(error)
                res.status(400)
                throw new Error('Có lỗi xảy ra')
            })

        pagination = {
            page: 1,
            limit: users.length,
            totalRows: users.length,
        }
    }

    const dataReturn = {
        data: users,
        pagination,
    }

    res.status(200).json(dataReturn)
})

// @desc    Get user by name
// @route   GET /api/users/search
// @access  Public
// const getUserByName = asyncHandler(async (req, res) => {
//     const userList = await User.find({
//         search: { $regex: req.query.name, $options: 'i' },
//         role: process.env.USER_ROLE,
//     }).select(process.env.USER_INFO)

//     res.status(200).json(userList)
// })

// @desc    Get top user favourite
// @route   GET /api/users/top
// @access  Public
// const getTopUsersFavourite = asyncHandler(async (req, res) => {
//     // const top = req.query.top || process.env.TOP_USER
//     const top = Number.parseInt(req.query.top) || null

//     const users = await User.find({ role: process.env.USER_ROLE })
//         .select(process.env.USER_INFO)
//         .sort({ likeCount: 'desc' })
//         .limit(top)

//     res.status(200).json(users)
// })

// @desc    Get user by id
// @route   GET /api/users/:userId
// @access  Public
const getUserById = asyncHandler(async (req, res) => {
    const userId = req.params.userId
    const user = await User.findById(userId).where({ role: process.env.USER_ROLE }).select(process.env.USER_INFO)

    if (!user) {
        res.status(400)
        throw new Error('Nghệ sĩ không tồn tại')
    }

    res.status(200).json(user)
})

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const resgiter = asyncHandler(async (req, res) => {
    const { name, artistName, description, username, password } = req.body
    let image

    if (!name || !artistName || !username || !password) {
        res.status(400)
        throw new Error('Vui lòng nhập đầy đủ các trường')
    }

    // check if exists user
    const userExist = await User.findOne({ username })
    const count = await User.find({ name }).count()

    if (userExist) {
        res.status(400)
        throw new Error('Tài khoản đã tồn tại')
    }

    if (req.file) {
        const imagePath = req.file.path
        image = await uploadImage(artistName, 'avatar', imagePath)
    }

    // hash password
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = await User.create({
        name,
        slug: `${slugtify(name, slugifyOptions)}-${count}`,
        artistName,
        artistNameRef: slugtify(artistName, slugifyOptions),
        description,
        avatar: image?.secure_url,
        avatarCloudinaryId: image?.public_id,
        username,
        password: hash,
        search: slugtify(name, slugifyOptionsSearch),
    })

    if (user) {
        res.status(201).json({
            id: user._id,
            name: user.name,
            slug: user.slug,
            artistName: user.artistName,
            avatar: user.avatar,
            description: user.description,
            likeCount: user.likeCount,
            token: generateToken(user._id),
        })
    } else {
        res.status(400)
        throw new Error('Dữ liệu người dùng không hợp lệ')
    }
})

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        res.status(400)
        throw new Error('Vui lòng nhập đầy đủ các trường')
    }

    // check user for username
    const user = await User.findOne({ username })

    if (user && (await bcrypt.compare(password, user.password))) {
        res.status(200).json({
            id: user._id,
            name: user.name,
            slug: user.slug,
            artistName: user.artistName,
            avatar: user.avatar,
            description: user.description,
            likeCount: user.likeCount,
            token: generateToken(user._id),
        })
    } else {
        res.status(400)
        throw new Error('Tài khoản hoặc mật khẩu không đúng')
    }
})

// @desc    Get user data
// @route   PUT /api/users/reset?userId=x
// @access  Private (admin)
const resetPassword = asyncHandler(async (req, res) => {
    const userId = req.query.userId
    const user = await User.findById(userId)

    if (user) {
        // hash password
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(process.env.PASSWORD_RESET, salt)

        user.password = hash

        await User.findByIdAndUpdate(userId, user)
        res.status(200).json('Đặt lại mật khẩu thành công')
    } else {
        res.status(400)
        throw new Error('Người dùng không tồn tại')
    }
})

// @desc    Toggle role user
// @route   PUT /api/users/toggleRole?userId=x
// @access  Private (admin)
const toggleRole = asyncHandler(async (req, res) => {
    const userId = req.query.userId
    const user = await User.findById(userId)

    if (user) {
        user.role = user.role === process.env.ADMIN_ROLE ? process.env.USER_ROLE : process.env.ADMIN_ROLE
        await user.save()
        res.status(200).json({ id: user._id, role: user.role })
    } else {
        res.status(400)
        throw new Error('Người dùng không tồn tại')
    }
})

// @desc    Toggle status user
// @route   PUT /api/users/toggleStatus?userId=x
// @access  Private (admin)
const toggleStatus = asyncHandler(async (req, res) => {
    const userId = req.query.userId
    const user = await User.findById(userId)

    if (user) {
        user.status =
            user.status === process.env.STATUS_ACTIVE ? process.env.STATUS_INACTIVE : process.env.STATUS_ACTIVE
        await user.save()
        res.status(200).json({ id: user._id, status: user.status })
    } else {
        res.status(400)
        throw new Error('Người dùng không tồn tại')
    }
})

// @desc    Like user
// @route   PUT /api/users/like?userId=x
// @access  Private (user)
const likeUser = asyncHandler(async (req, res) => {
    const userId = req.query.userId
    const user = await User.findById(userId)

    if (user) {
        user.likeCount = user.likeCount + 1
        await user.save()
        res.status(200).json({ id: user._id, likeCount: user.likeCount })
    } else {
        res.status(400)
        throw new Error('Nghệ sĩ không tồn tại')
    }
})

// @desc    Delete user
// @route   DELETE /api/users/:userId
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId
    const user = await User.findById(userId)

    // check user exist
    if (!user) {
        res.status(401)
        throw new Error('Người dùng không tồn tại')
    }

    // delete image cloudinary
    await deleteImage(user.avatarCloudinaryId)

    await user.remove()

    res.status(200).json({ id: userId })
})

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

export {
    getUserList,
    getUsers,
    // getUserByName,
    // getTopUsersFavourite,
    getUserById,
    resgiter,
    login,
    resetPassword,
    toggleRole,
    toggleStatus,
    likeUser,
    deleteUser,
}
