const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../../secrets')
const db = require('../../data/db-config')
const { validateRoleName, checkUsernameExists } = require('./auth-middleware')

function generateToken(user) {
  const payload = {
    subject: user.user_id,
    username: user.username,
    role_name: user.role_name,
  }
  const options = {
    expiresIn: '1d',
  }
  return jwt.sign(payload, JWT_SECRET, options)
}

router.post('/register', async (req, res, next) => {
  try {
    let { username, password, role_name } = req.body
    
    // Check if username exists
    const [existingUser] = await db('users')
      .where('username', username)
    
    if (existingUser) {
      return res.status(422).json({ message: 'Username taken' })
    }
    
    // Default role if not provided
    if (!role_name) {
      role_name = 'student'
    } else {
      // Trim whitespace from role_name
      role_name = role_name.trim()
      
      // Check if role_name is too long
      if (role_name.length > 32) {
        return res.status(422).json({ message: 'Role name can not be longer than 32 chars' })
      }
      
      // Prevent registering as admin
      if (role_name.toLowerCase() === 'admin') {
        return res.status(422).json({ message: 'Role name can not be admin' })
      }
    }
    
    // Find or create the role
    let role = await db('roles').where('role_name', role_name).first()
    
    if (!role) {
      // Create the new role
      const [roleId] = await db('roles').insert({ role_name })
      role = { role_id: roleId }
    }
    
    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 8)
    
    // Insert the new user
    const [user_id] = await db('users').insert({
      username,
      password: hashedPassword,
      role_id: role.role_id,
    })
    
    // Get the newly created user
    const newUser = await db('users as u')
      .join('roles as r', 'u.role_id', 'r.role_id')
      .select('u.user_id', 'u.username', 'r.role_name')
      .where('u.user_id', user_id)
      .first()
    
    res.status(201).json(newUser)
  } catch (err) {
    next(err)
  }
})

router.post('/login', checkUsernameExists, async (req, res, next) => {
  try {
    const { password } = req.body
    
    const passwordValid = bcrypt.compareSync(password, req.user.password)
    
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    const token = generateToken(req.user)
    
    res.json({
      message: `${req.user.username} is back`,
      token,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router