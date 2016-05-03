const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = mongoose.Schema({
  email: String,
  local: {
    password: String
  },
  google: {
    id: String,
    access_token: String,
    name: String,
  },
})

userSchema.statics.encrypt = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.local.password)
}
// instance method, (vs statics) must have a specific user's password

module.exports = mongoose.model('User', userSchema)
