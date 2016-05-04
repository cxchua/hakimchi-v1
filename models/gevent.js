const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const geventSchema = mongoose.Schema({
  eventDate       : Date,
  eventSummary    : String,
  eventAttendees  : [String],
  user            : {type: mongoose.Schema.ObjectId, ref: 'User', required: true}
})



module.exports = mongoose.model('Gevent', geventSchema)
