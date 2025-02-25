const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../../secrets')
const Users = require('../users/users-model')
const db = require('../../data/db-config')

const restricted = (req, res, next) => {
  const token = req.headers.authorization
  if (!token) {
    return res.status(401).json({ message: 'Token required' })
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token invalid' })
    }
    req.decodedJwt = decoded
    next()
  })
}

const only = role_name => (req, res, next) => {
  if (req.decodedJwt.role_name !== role_name) {
    return res.status(403).json({ message: 'This is not for you' })
  }
  next()
}

const checkUsernameExists = async (req, res, next) => {
  try {
    const [user] = await Users.findBy({ username: req.body.username })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

const validateRoleName = async (req, res, next) => {
  try {
    if (!req.body.role_name) {
      req.role_name = 'student' // Default role
      return next()
    }
    
    const role_name = req.body.role_name.trim()
    
    // Check if role_name is too long
    if (role_name.length > 32) {
      return res.status(422).json({ message: 'Role name can not be longer than 32 chars' })
    }
    
    // Prevent registering as admin
    if (role_name.toLowerCase() === 'admin') {
      return res.status(422).json({ message: 'Role name can not be admin' })
    }
    
    req.role_name = role_name
    next()
  } catch (err) {
    next(err)
  }
}
module.exports = {
  restricted,
  only,
  checkUsernameExists,
  validateRoleName,
}