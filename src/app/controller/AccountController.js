import bcrypt from 'bcrypt'
import { accountModel } from '../models/Account.js'

export const getAllAccount = async (req, res) => {
    try {
        let accountList = await accountModel.find()
        res.status(200).json({ data: accountList })
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const login = async (req, res) => {
    try {
        let data = req.body
        let account = await accountModel.findOne({ username: data.username })
        if (account) {
            const isValidPassword = await bcrypt.compare(data.password, account.password)
            if (isValidPassword) {
                res.status(200).json(account)
            } else {
                res.status(500).json('password wrong')
            }
        } else {
            res.status(500).json('username is not exists')
        }
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const toggleStatus = async (req, res) => {
    try {
        let accountId = req.query.accountId
        let account = await accountModel.findById(accountId)
        if (account) {
            if (account.status === 'active') {
                account.status = 'inactive'
            } else {
                account.status = 'active'
            }
            const newAccount = await accountModel.findByIdAndUpdate({ _id: accountId }, account, { new: true })
            res.status(200).json(newAccount)
        }
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const changeRole = async (req, res) => {
    try {
        let accountId = req.query.accountId
        let account = await accountModel.findById(accountId)
        if (account) {
            if (account.role === 'admin') {
                account.role = 'user'
            } else {
                account.role = 'admin'
            }
            const newAccount = await accountModel.findByIdAndUpdate({ _id: accountId }, account, { new: true })
            res.status(200).json(newAccount)
        }
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const register = async (req, res) => {
    try {
        let addAccount = req.body
        let accountExit = await accountModel.findOne({ username: addAccount.username })
        if (accountExit) {
            return res.status(500).json('username available')
        }
        const hash = await bcrypt.hash(addAccount.password, 10)
        addAccount.password = hash
        let account = new accountModel(addAccount)
        await account.save()
        res.status(200).json(account)
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const updateAccount = async (req, res) => {
    try {
        let updateAccount = req.body
        let accountId = req.query.accountId
        let account = await accountModel.findById(accountId)
        if (!account) {
            return res.status(500).json('No account')
        }
        account = await accountModel.findByIdAndUpdate({ _id: accountId }, updateAccount, { new: true })
        res.status(200).json(account)
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const deleteAccount = async (req, res) => {
    try {
        let accountId = req.query.accountId
        let account = await accountModel.findById(accountId)
        if (!account) {
            return res.status(500).json('No account')
        }
        await account.remove()
        res.status(200).json(account)
    } catch (err) {
        res.status(500).json({ err })
    }
}
