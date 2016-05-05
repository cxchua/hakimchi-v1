const mongoose = require('mongoose')

const gcontactSchema = mongoose.Schema({
  contactname     : String,
  contactEmail    : [String],
  contactPhone    : [String],
  contactBirthday : Date,
  contactLastInteraction: {
    Meeting               : Date,
    Email                 : Date,
    FBMsg                 : Date,
    Whatsapp              : Date,
    OtherInteraction      : Date,
    LatestInteraction     : Date,
  },
  user            : {type: mongoose.Schema.ObjectId, ref: 'User', required: true}

})



module.exports = mongoose.model('Gcontact', gcontactSchema)
