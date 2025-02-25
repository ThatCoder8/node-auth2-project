// DO NOT CHANGE THIS FILE
const knex = require('knex')
const environment = process.env.NODE_ENV || 'development'
const configs = require('../knexfile.js')

module.exports = knex(configs[environment])
