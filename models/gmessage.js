const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const gmessageSchema = mongoose.Schema({
  messageDate       : Date,
  messageFrom       : String,
  messageTo         : [String],
  messageCc         : [String],  
  messageSubject    : String,
  user            : {type: mongoose.Schema.ObjectId, ref: 'User', required: true}
})



module.exports = mongoose.model('Gmessage', gmessageSchema)
