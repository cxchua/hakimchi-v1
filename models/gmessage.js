const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const gmessageSchema = mongoose.Schema({
  messageDate       : Date,
  messageFrom       : String,
  messageTo         : [String],
  messageCc         : [String],
  messageSubject    : String,
  googleid          : String,
  user              : {type: mongoose.Schema.ObjectId, ref: 'User', required: true},
  gcontacts         : [{type: mongoose.Schema.ObjectId, ref: 'Gcontact', required: false}]
})



module.exports = mongoose.model('Gmessage', gmessageSchema)
