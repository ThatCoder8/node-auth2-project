const db = require('../../data/db-config')

async function find() {
  const users = await db('users as u')
    .join('roles as r', 'u.role_id', 'r.role_id')
    .select('u.user_id', 'u.username', 'r.role_name')
  return users
}

async function findBy(filter) {
  const users = await db('users as u')
    .join('roles as r', 'u.role_id', 'r.role_id')
    .select('u.user_id', 'u.username', 'u.password', 'r.role_name')
    .where(filter)
  return users
}

async function findById(user_id) {
  const user = await db('users as u')
    .join('roles as r', 'u.role_id', 'r.role_id')
    .select('u.user_id', 'u.username', 'r.role_name')
    .where('u.user_id', user_id)
    .first()
  return user
}

async function add({ username, password, role_name }) {
  let created_user_id
  await db.transaction(async trx => {
    let role_id_to_use
    const [role] = await trx('roles').where('role_name', role_name)
    if (role) {
      role_id_to_use = role.role_id
    } else {
      const [role_id] = await trx('roles').insert({ role_name: role_name })
      role_id_to_use = role_id
    }
    const [user_id] = await trx('users').insert({ username, password, role_id: role_id_to_use })
    created_user_id = user_id
  })
  return findById(created_user_id)
}

module.exports = {
  find,
  findBy,
  findById,
  add,
}