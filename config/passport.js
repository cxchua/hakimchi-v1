'use strict';

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
var config = require('../.env.json')[process.env.NODE_ENV || 'development'];

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
    clientID: config.GOOGLE_API_CLIENT_ID,
    clientSecret: config.GOOGLE_API_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: ['profile','https://www.googleapis.com/auth/calendar.readonly','https://www.googleapis.com/auth/gmail.readonly','https://www.google.com/m8/feeds/']
  },
  function(accessToken, refreshToken, profile, done) {
      console.log("Access Token:" + accessToken)
      var bodyGContacts = {}
      var bodyGEvents = {}
      var bodyGMessages = {}
      var bodyGMessagesParties = {}
      var arrayOfGContacts = []
      var arrayOfGEvents = []
      var arrayOfGMessages = []
      var arrayOfContactsLinkedToEvents = []
      var arrayOfContactsLinkedToMessages = []

      //Calling for contacts data
      request("https://www.google.com/m8/feeds/contacts/default/full?alt=json&start-index=1&max-results=1000&access_token="+accessToken,function(error,response,body){
        bodyGContacts = JSON.parse(body);
        console.log(bodyGContacts.feed.id.$t);
        // console.log('CONTACTS:')
        for(let i=0; i<bodyGContacts.feed.entry.length; i++){
          var singleGContact = {}
          if (typeof bodyGContacts.feed.entry[i].title.$t != 'undefined') {singleGContact.contactname = bodyGContacts.feed.entry[i].title.$t}

          if (typeof bodyGContacts.feed.entry[i].gd$email != 'undefined'){
          singleGContact.contactEmail = []
            for(let z=0; z<bodyGContacts.feed.entry[i].gd$email.length; z++){
              if( typeof bodyGContacts.feed.entry[i].gd$email[z] != 'undefined') {
                singleGContact.contactEmail[z] = bodyGContacts.feed.entry[i].gd$email[z].address
              }
            }
          }

          if (typeof bodyGContacts.feed.entry[i].gd$phoneNumber != 'undefined'){
          singleGContact.contactPhone = []
            for(let z=0; z<bodyGContacts.feed.entry[i].gd$phoneNumber.length; z++){
              if( typeof bodyGContacts.feed.entry[i].gd$phoneNumber[z] != 'undefined') {
                singleGContact.contactPhone[z] = bodyGContacts.feed.entry[i].gd$phoneNumber[z].$t
              }
            }
          }
          arrayOfGContacts.push(singleGContact)
        }
      })

      //Calling for calendar data
      request("https://www.googleapis.com/calendar/v3/calendars/primary/events?alt=json&start-date=50daysAgo&max-results=100&access_token="+accessToken,function(error,response,body){
        bodyGEvents = JSON.parse(body);
        // console.log('CALENDAR EVENTS:')
        for(let i=0; i<bodyGEvents.items.length; i++){
          var singleGEvent = {}
          if (typeof bodyGEvents.items[i].start != 'undefined') {singleGEvent.eventDate = bodyGEvents.items[i].start.dateTime}
          if (typeof bodyGEvents.items[i].id != 'undefined') {singleGEvent.googleid = bodyGEvents.items[i].id}

          if (typeof bodyGEvents.items[i].summary != 'undefined') {singleGEvent.eventSummary = bodyGEvents.items[i].summary}
          if (typeof bodyGEvents.items[i].attendees != 'undefined'){
          singleGEvent.eventAttendees = []
            for(let z=0;z<bodyGEvents.items[i].attendees.length;z++){
              if( typeof bodyGEvents.items[i].attendees[z] != 'undefined') {singleGEvent.eventAttendees[z] = bodyGEvents.items[i].attendees[z].email }
            }
          }
          arrayOfGEvents.push(singleGEvent)
        }
      })

      //Calling for mail data - message
      request("https://www.googleapis.com/gmail/v1/users/me/messages?alt=json&start-date=50daysAgo&max-results=100&access_token="+accessToken,function(error,response,body){
        var bodyX = JSON.parse(body);
        // console.log('MESSAGE DATA:')
        for(let i=0; i<bodyX.messages.length; i++){
          var urlY = ('https://www.googleapis.com/gmail/v1/users/me/messages/'+ (bodyX.messages[i].id) + '?alt=json&start-index=1&max-results=10&access_token=' + accessToken)
          request(urlY,function(error,response,body){
            var singleGMessage = {}
            bodyGMessages = JSON.parse(body);

            if (typeof bodyGMessages.id != 'undefined') {singleGMessage.googleid = bodyGMessages.id}

            for(let j=0; j<bodyGMessages.payload.headers.length; j++){
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

                  for(let x=0; x<(numberOfToParties); x++){
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

                  for(let x=0; x<(numberOfCcParties); x++){
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

                  for(let k=0; k<arrayOfGContacts.length; k++){
                    var newGContact = new Gcontact();
                    if (typeof arrayOfGContacts[k].contactname != 'undefined'){newGContact.contactname = arrayOfGContacts[k].contactname;}
                    if (typeof arrayOfGContacts[k].contactEmail != 'undefined'){newGContact.contactEmail = arrayOfGContacts[k].contactEmail}
                    if (typeof arrayOfGContacts[k].contactPhone != 'undefined'){newGContact.contactPhone = arrayOfGContacts[k].contactPhone}
                    newGContact.user            = user._id;

                    newGContact.save(function(err, gcontact){
                      if(err) return done(err);
                    })
                  }

                  for(let l=0; l<arrayOfGEvents.length; l++){
                    var newGEvent = new Gevent();
                    if (typeof arrayOfGEvents[l].googleid != 'undefined'){newGEvent.googleid = arrayOfGEvents[l].googleid;}
                    if (typeof arrayOfGEvents[l].eventDate != 'undefined'){newGEvent.eventDate = arrayOfGEvents[l].eventDate;}
                    if (typeof arrayOfGEvents[l].eventSummary != 'undefined'){newGEvent.eventSummary = arrayOfGEvents[l].eventSummary;}
                    newGEvent.user          = user._id;
                    if (typeof arrayOfGEvents[l].eventAttendees != 'undefined'){
                      newGEvent.eventAttendees = arrayOfGEvents[l].eventAttendees;
                      for(let t=0; t<newGEvent.eventAttendees.length; t++){
                        Gcontact.find({'contactEmail':newGEvent.eventAttendees[t],'user':user._id}, function (error,contactsX){
                          if(error) {console.log};
                          var topush = contactsX[0];
                          if (typeof topush != 'undefined'){
                            var contactEventPair = {}

                            contactEventPair.contactID = topush._id;
                            contactEventPair.googleid = arrayOfGEvents[l].googleid;
                            contactEventPair.user = user._id;
                            arrayOfContactsLinkedToEvents.push(contactEventPair)
                            console.log(arrayOfContactsLinkedToEvents)
                          }
                        });
                      }
                    }
                    newGEvent.save(function(err, gevent){
                      if(err) return done(err);
                    })
                  }

                  for(let m=0; m<arrayOfGMessages.length; m++){
                    var newGMessage = new Gmessage();
                    if (typeof arrayOfGMessages[m].googleid != 'undefined'){newGMessage.googleid     = arrayOfGMessages[m].googleid;}
                    if (typeof arrayOfGMessages[m].messageDate != 'undefined'){newGMessage.messageDate     = arrayOfGMessages[m].messageDate;}
                    if (typeof arrayOfGMessages[m].messageFrom != 'undefined'){newGMessage.messageFrom     = arrayOfGMessages[m].messageFrom;}
                    if (typeof arrayOfGMessages[m].messageCc != 'undefined'){newGMessage.messageCc       = arrayOfGMessages[m].messageCc;}
                    if (typeof arrayOfGMessages[m].messageSubject != 'undefined'){newGMessage.messageSubject  = arrayOfGMessages[m].messageSubject;}
                    newGMessage.user            = user._id;
                    if (typeof arrayOfGMessages[m].messageTo != 'undefined'){
                      newGMessage.messageTo       = arrayOfGMessages[m].messageTo;
                      for(let pal=0; pal<newGMessage.messageTo.length; pal++){
                        Gcontact.find({'contactEmail':newGMessage.messageTo[pal],'user':user._id}, function (error,contactsX){
                          if(error) {console.log};
                          var topush = contactsX[0];
                          if (typeof topush != 'undefined'){
                            var contactMessagePair = {}

                            contactMessagePair.contactID = topush._id;
                            contactMessagePair.googleid = arrayOfGMessages[m].googleid;
                            contactMessagePair.user = user._id;
                            arrayOfContactsLinkedToMessages.push(contactMessagePair)
                            console.log(arrayOfContactsLinkedToMessages)
                          }
                        });
                      }
                    }

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
        },3000)

        setTimeout(function(){
          for(let s=0; s<arrayOfContactsLinkedToEvents.length; s++){
            Gevent.find({'googleid':arrayOfContactsLinkedToEvents[s].googleid,'user':arrayOfContactsLinkedToEvents[s].user}, function(error,eventX){
              eventX[0].gcontacts.push(arrayOfContactsLinkedToEvents[s].contactID);
              eventX[0].save(function(err,event){
                if(err) return done(err)
              })
            })
          }
          for(let w=0; w<arrayOfContactsLinkedToMessages.length; w++){
            Gmessage.find({'googleid':arrayOfContactsLinkedToMessages[w].googleid,'user':arrayOfContactsLinkedToMessages[w].user}, function(error,messageX){
              messageX[0].gcontacts.push(arrayOfContactsLinkedToMessages[w].contactID);
              messageX[0].save(function(err,event){
                if(err) return done(err)
              })
            })
          }
        },6000)

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
