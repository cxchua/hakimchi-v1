const mongoose = require('mongoose')

const gcontactSchema = mongoose.Schema({
  contactname     : String,
  contactEmail1   : String,
  contactEmail2   : String,
  contactEmail3   : String,
  contactPhone1   : String,
  contactPhone2   : String,
  contactPhone3   : String,     
  contactBirthday : Date,
  user            : {type: mongoose.Schema.ObjectId, ref: 'User', required: true}

})



module.exports = mongoose.model('Gcontact', gcontactSchema)
