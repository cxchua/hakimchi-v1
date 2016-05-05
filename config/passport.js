const User = require('../models/user')
const Gmessage = require('../models/gmessage')
const Gevent = require('../models/gevent')
const Gcontact = require('../models/gcontact')
const LocalStrategy = require('passport-local').Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy
const request = require('request')
const request2 = require('request-json')
var google = require('googleapis');
var client = request2.createClient('http://localhost:3000/');

// const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
// const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET

module.exports = function (passport){
  // store sessions (serialize & dezerialize)
  passport.serializeUser(function (user, done) {
    done(null, user.id)
  })

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      // console.log('deserializing user:', user)
      done(err, user)
    })
  })

  passport.use('google', new GoogleStrategy({
    clientID: '266175055372-fvrdomie0qlg3kecntp32ub090oraj05.apps.googleusercontent.com',
    clientSecret: 'avYamacln1oZ7mlJpGcsfeLL',
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: ['profile','https://www.googleapis.com/auth/calendar.readonly','https://www.googleapis.com/auth/gmail.readonly','https://www.google.com/m8/feeds/']
  },
  function(accessToken, refreshToken, profile, done) {
      // console.log(accessToken);
      console.log("Access Token:" + accessToken)
      // console.log(profile._json.id)
      var bodyGContacts = {}
      var bodyGEvents = {}
      var bodyGMessages = {}
      var bodyGMessagesParties = {}
      var arrayOfGContacts = []
      var arrayOfGEvents = []
      var arrayOfGMessages = []

      //Calling for contacts data
      request("https://www.google.com/m8/feeds/contacts/default/full?alt=json&start-index=1&max-results=1000&access_token="+accessToken,function(error,response,body){
        bodyGContacts = JSON.parse(body);
        console.log(bodyGContacts.feed.id.$t);
        // console.log('CONTACTS:')
        for(i=0; i<bodyGContacts.feed.entry.length; i++){
          var singleGContact = {}
          if (typeof bodyGContacts.feed.entry[i].title.$t != 'undefined') {singleGContact.contactname = bodyGContacts.feed.entry[i].title.$t}

          if (typeof bodyGContacts.feed.entry[i].gd$email != 'undefined'){
          singleGContact.contactEmail = []
            for(z=0; z<bodyGContacts.feed.entry[i].gd$email.length; z++){
              if( typeof bodyGContacts.feed.entry[i].gd$email[z] != 'undefined') {
                singleGContact.contactEmail[z] = bodyGContacts.feed.entry[i].gd$email[z].address
              }
            }
          }

          if (typeof bodyGContacts.feed.entry[i].gd$phoneNumber != 'undefined'){
          singleGContact.contactPhone = []
            for(z=0; z<bodyGContacts.feed.entry[i].gd$phoneNumber.length; z++){
              if( typeof bodyGContacts.feed.entry[i].gd$phoneNumber[z] != 'undefined') {
                singleGContact.contactPhone[z] = bodyGContacts.feed.entry[i].gd$phoneNumber[z].$t
              }
            }
          }
          arrayOfGContacts.push(singleGContact)
        }
        // console.log(arrayOfGContacts)
      })

      //Calling for calendar data
      request("https://www.googleapis.com/calendar/v3/calendars/primary/events?alt=json&start-index=1&max-results=10&access_token="+accessToken,function(error,response,body){
        bodyGEvents = JSON.parse(body);
        // console.log('CALENDAR EVENTS:')
        for(i=0; i<bodyGEvents.items.length; i++){
          var singleGEvent = {}
          if (typeof bodyGEvents.items[i].start != 'undefined') {singleGEvent.eventDate = bodyGEvents.items[i].start.dateTime}
          if (typeof bodyGEvents.items[i].summary != 'undefined') {singleGEvent.eventSummary = bodyGEvents.items[i].summary}
          if (typeof bodyGEvents.items[i].attendees != 'undefined'){
          singleGEvent.eventAttendees = []
            for(z=0;z<bodyGEvents.items[i].attendees.length;z++){
              if( typeof bodyGEvents.items[i].attendees[z] != 'undefined') {singleGEvent.eventAttendees[z] = bodyGEvents.items[i].attendees[z].email }
            }
          }
          arrayOfGEvents.push(singleGEvent)
        }
        // console.log(arrayOfGEvents)
      })

      //Calling for mail data - message
      request("https://www.googleapis.com/gmail/v1/users/me/messages?alt=json&start-index=1&max-results=10&access_token="+accessToken,function(error,response,body){
        var bodyX = JSON.parse(body);
        // console.log('MESSAGE DATA:')
        for(i=0; i<bodyX.messages.length; i++){
          var urlY = ('https://www.googleapis.com/gmail/v1/users/me/messages/'+ (bodyX.messages[i].id) + '?alt=json&start-index=1&max-results=10&access_token=' + accessToken)
          request(urlY,function(error,response,body){
            var singleGMessage = {}
            bodyGMessages = JSON.parse(body);
            // console.log('Message ID:' + bodyGMessages.id)
            // console.log('Headers:' + bodyY.payload.headers.length)
            for (j=0; j<bodyGMessages.payload.headers.length; j++){
              if(bodyGMessages.payload.headers[j].name==="Date") {
                singleGMessage.messageDate = bodyGMessages.payload.headers[j].value
              }

              if(bodyGMessages.payload.headers[j].name==="From") {
                var fullFromString = bodyGMessages.payload.headers[j].value
                if(fullFromString.indexOf("<") > 0){
                  var emailOnly = fullFromString.substring(fullFromString.lastIndexOf("<")+1,fullFromString.lastIndexOf(">"))
                  bodyGMessagesParties.from = emailOnly
                  singleGMessage.messageFrom = bodyGMessagesParties.from
                }
                else {
                  bodyGMessagesParties.from = fullFromString
                  singleGMessage.messageFrom = bodyGMessagesParties.from
                }
              }

              if(bodyGMessages.payload.headers[j].name==="To") {
                var fullFromString = bodyGMessages.payload.headers[j].value
                var numberOfToParties = (fullFromString.match(/</g) || []).length
                if(fullFromString.indexOf("<") > 0){
                  var emails = [];

                  var fullFromStringPlayed = fullFromString;

                  for (x=0; x<(numberOfToParties); x++){
                  	emails[x] = fullFromStringPlayed.substring(fullFromStringPlayed.indexOf("<")+1,fullFromStringPlayed.indexOf(">"))
                  	fullFromStringPlayed = fullFromStringPlayed.substring(fullFromStringPlayed.indexOf(">")+1);
                  }
                  bodyGMessagesParties.to = emails
                  singleGMessage.messageTo = bodyGMessagesParties.to
                }
                else {
                  bodyGMessagesParties.to = [fullFromString]
                  singleGMessage.messageTo = bodyGMessagesParties.to
                }
              }

              if(bodyGMessages.payload.headers[j].name==="Cc") {
                var fullFromString = bodyGMessages.payload.headers[j].value
                var numberOfCcParties = (fullFromString.match(/</g) || []).length
                if(fullFromString.indexOf("<") > 0){
                  var emails = [];

                  var fullFromStringPlayed = fullFromString;

                  for (x=0; x<(numberOfCcParties); x++){
                  	emails[x] = fullFromStringPlayed.substring(fullFromStringPlayed.indexOf("<")+1,fullFromStringPlayed.indexOf(">"))
                  	fullFromStringPlayed = fullFromStringPlayed.substring(fullFromStringPlayed.indexOf(">")+1);
                  }
                  bodyGMessagesParties.Cc = emails
                  singleGMessage.messageCc = bodyGMessagesParties.Cc
                }
                else {
                  bodyGMessagesParties.Cc = [fullFromString]
                  singleGMessage.messageCc = bodyGMessagesParties.Cc
                }
              }

              if(bodyGMessages.payload.headers[j].name==="Subject") {
                singleGMessage.messageSubject = bodyGMessages.payload.headers[j].value
              }
            }
          arrayOfGMessages.push(singleGMessage)
          })

        }
      })

      //Check if user exists; if not create user entry + populate the contacts, events and calendar events
      setTimeout(function(){
          User.findOne({'googleid': profile._json.id }, function (err, user) {
            if (err) {
              console.log(err) // handle errors!
            }
            if (!err && user !== null) {
              user.access_token = accessToken
              user.refresh_token = refreshToken

              user.save(function (err){
                if (err) {
                  console.log(err) // handle errors!
                } else {
                  console.log('updating user')
                  done(null, user,{message:accessToken})
                }
              })
            } else {

              var newUser = new User()
              newUser.useremail     = bodyGContacts.feed.id.$t
              newUser.googleid      = profile._json.id
              newUser.access_token  = accessToken
              newUser.refresh_token = refreshToken

              newUser.save(function (err, user) {
                if (err) {
                  console.log(err) // handle errors!
                } else {

                  for(k=0; k<arrayOfGContacts.length; k++){
                    var newGContact = new Gcontact();
                    if (typeof arrayOfGContacts[k].contactname != 'undefined'){newGContact.contactname = arrayOfGContacts[k].contactname;}
                    if (typeof arrayOfGContacts[k].contactEmail != 'undefined'){newGContact.contactEmail = arrayOfGContacts[k].contactEmail}
                    if (typeof arrayOfGContacts[k].contactPhone != 'undefined'){newGContact.contactPhone = arrayOfGContacts[k].contactPhone}
                    newGContact.user            = user._id;

                    newGContact.save(function(err, gcontact){
                      if(err) return done(err);
                    })
                  }

                  for(l=0; l<arrayOfGEvents.length; l++){
                    var newGEvent = new Gevent();
                    if (typeof arrayOfGEvents[l].eventDate != 'undefined'){newGEvent.eventDate = arrayOfGEvents[l].eventDate;}
                    if (typeof arrayOfGEvents[l].eventSummary != 'undefined'){newGEvent.eventSummary = arrayOfGEvents[l].eventSummary;}
                    if (typeof arrayOfGEvents[l].eventAttendees != 'undefined'){newGEvent.eventAttendees = arrayOfGEvents[l].eventAttendees;}
                    newGEvent.user          = user._id;

                    newGEvent.save(function(err, gevent){
                      if(err) return done(err);
                    })
                  }

                  for(m=0; m<arrayOfGMessages.length; m++){
                    var newGMessage = new Gmessage();
                    if (typeof arrayOfGMessages[m].messageDate != 'undefined'){newGMessage.messageDate     = arrayOfGMessages[m].messageDate;}
                    if (typeof arrayOfGMessages[m].messageFrom != 'undefined'){newGMessage.messageFrom     = arrayOfGMessages[m].messageFrom;}
                    if (typeof arrayOfGMessages[m].messageTo != 'undefined'){newGMessage.messageTo       = arrayOfGMessages[m].messageTo;}
                    if (typeof arrayOfGMessages[m].messageCc != 'undefined'){newGMessage.messageCc       = arrayOfGMessages[m].messageCc;}
                    if (typeof arrayOfGMessages[m].messageSubject != 'undefined'){newGMessage.messageSubject  = arrayOfGMessages[m].messageSubject;}
                    newGMessage.user            = user._id;

                    newGMessage.save(function(err, gmessage){
                      if(err) return done(err);
                    })
                  }

                  console.log('saving user')
                  done(null, user,{message:accessToken})
                }
              })

            }

          })
        },10000)

    }
))
}


//// Using request-json instead for contacts
// client.get("https://www.google.com/m8/feeds/contacts/default/full?alt=json&access_token="+accessToken, function(err, res, body) {
//   for(i=0; i<body.feed.entry.length; i++){
//     console.log(body.feed.entry[i].title.$t);
//     console.log(body.feed.entry[i].gd$email[0].address);
//   }
// });
