const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const geventSchema = mongoose.Schema({
  eventDate       : Date,
  eventSummary    : String,
  eventAttendees  : [String],
  googleid        : String,  
  user            : {type: mongoose.Schema.ObjectId, ref: 'User', required: true},
  gcontacts       : [{type: mongoose.Schema.ObjectId, ref: 'Gcontact', required: false}]
})




// for (x=0; x< arrayOfGContacts.length; x++){
//   for (y=0; y< arrayOfGContacts[x].contactEmail.length; y++){
//     var result = arrayOfGEvents[l].eventAttendees.filter(function(obj){
//       return obj == arrayOfGContacts[x].contactEmail[y]
//     })
//     if (result != 0) {
//       console.log(arrayOfGEvents[l].eventSummary + ' was attended by contact ' + arrayOfGContacts[x].contactname + 'with these email addresses' + result[0])
//       newGEvent.gcontacts.push(arrayOfGContacts)
//     }
//   }
// }




module.exports = mongoose.model('Gevent', geventSchema)
