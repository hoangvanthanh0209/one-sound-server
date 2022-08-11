import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import asyncHandler from 'express-async-handler'
import slugtify from 'slugify'

import { User } from '../models/index.js'
import { uploadImage } from '../../utils/cloundinary.js'

dotenv.config()

const slugifyOptions = {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: false,
    locale: 'vi',
    trim: true,
}

// @desc    Get user list
// @route   GET /api/users
// @access  Private (admin)
const getUserList = asyncHandler(async (req, res) => {
    const userList = await User.find().select(process.env.USER_INFO_ADMIN).sort({ role: 'asc', name: 'desc' })

    if (!userList) {
        res.status(400)
        throw new Error('Danh sách thành viên trống')
    }

    res.status(200).json(userList)
})

// @desc    Get users for page
// @route   GET /api/users/query
// @access  Public
const getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 8 } = req.query

    const userCount = await User.aggregate().count('count')
    const count = userCount[0].count

    const start = (+page - 1) * +limit
    const end = +page * +limit > count ? count : +page * +limit

    const userList = await User.find({ role: process.env.USER_ROLE })
        .select(process.env.USER_INFO)
        .skip(start)
        .limit(end)

    if (!userList) {
        res.status(400)
        throw new Error('Danh sách nghệ sĩ trống')
    }

    res.status(200).json(userList)
})

// @desc    Get user by name
// @route   GET /api/users/search
// @access  Public
const getUserByName = asyncHandler(async (req, res) => {
    const userList = await User.find({
        name: { $regex: req.query.name, $options: 'i' },
        role: process.env.USER_ROLE,
    }).select(process.env.USER_INFO)

    if (!userList) {
        res.status(400)
        throw new Error('Danh sách nghệ sĩ trống')
    }

    res.status(200).json(userList)
})

// @desc    Get top user favourite
// @route   GET /api/users/top
// @access  Public
const getTopUsersFavourite = asyncHandler(async (req, res) => {
    const top = req.query.top || process.env.TOP_USER

    const users = await User.find({ role: process.env.USER_ROLE })
        .select(process.env.USER_INFO)
        .sort({ likeCount: 'desc' })
        .limit(+top)

    if (!users) {
        res.status(400)
        throw new Error('Danh sách nghệ sĩ trống')
    }

    res.status(200).json(users)
})

// @desc    Get user by id
// @route   GET /api/users/:id
// @access  Public
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).where({ role: process.env.USER_ROLE }).select(process.env.USER_INFO)

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
        slug: `${slugtify(name, { slugifyOptions })}-${count}`,
        artistName,
        artistNameRef: artistName,
        description,
        avatar: image?.secure_url || process.env.AVATAR_DEFAULT,
        avatarCloudinaryId: image?.public_id,
        username,
        password: hash,
    })

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            slug: user.slug,
            artistName: user.artistName,
            avatar: user.avatar,
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

    // check user for username
    const user = await User.findOne({ username })

    if (user && (await bcrypt.compare(password, user.password))) {
        res.status(200).json({
            _id: user.id,
            name: user.name,
            slug: user.slug,
            artistName: user.artistName,
            avatar: user.avatar,
            likeCount: user.likeCount,
            token: generateToken(user._id),
        })
    } else {
        res.status(400)
        throw new Error('Thông tin không hợp lệ')
    }
})

// @desc    Get user data
// @route   PUT /api/users/reset/:id
// @access  Private (admin)
const resetPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)

    if (user) {
        // hash password
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(process.env.PASSWORD_RESET, salt)

        user.password = hash

        const updatedUser = await User.findByIdAndUpdate(req.params.id, user, { new: true })
        res.status(200).json(updatedUser)
    } else {
        res.status(400)
        throw new Error('Người dùng không tồn tại')
    }
})

// @desc    Toggle role user
// @route   PUT /api/users/toggleRole/:id
// @access  Private (admin)
const toggleRole = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)

    if (user) {
        user.role = user.role === process.env.ADMIN_ROLE ? process.env.USER_ROLE : process.env.ADMIN_ROLE
        await user.save()
        res.status(200).json(user)
    } else {
        res.status(400)
        throw new Error('Người dùng không tồn tại')
    }
})

// @desc    Toggle status user
// @route   PUT /api/users/toggleStatus/:id
// @access  Private (admin)
const toggleStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)

    if (user) {
        user.status =
            user.status === process.env.STATUS_ACTIVE ? process.env.STATUS_INACTIVE : process.env.STATUS_ACTIVE
        await user.save()
        res.status(200).json(user)
    } else {
        res.status(400)
        throw new Error('Người dùng không tồn tại')
    }
})

// @desc    Like user
// @route   PUT /api/users/like/:id
// @access  Private (user)
const likeUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select(process.env.USER_INFO)

    if (user) {
        user.likeCount = user.likeCount + 1
        await user.save()
        res.status(200).json(user)
    } else {
        res.status(400)
        throw new Error('Nghệ sĩ không tồn tại')
    }
})

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)

    // check user exist
    if (!user) {
        res.status(401)
        throw new Error('Người dùng không tồn tại')
    }

    // delete image cloudinary
    await deleteImage(user.avatarCloudinaryId)

    await user.remove()

    res.status(200).json({ id: req.params.id })
})

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

export {
    getUserList,
    getUsers,
    getUserByName,
    getTopUsersFavourite,
    getUserById,
    resgiter,
    login,
    resetPassword,
    toggleRole,
    toggleStatus,
    likeUser,
    deleteUser,
}
