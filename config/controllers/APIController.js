'use strict';

var Gcontact = require('../../models/gcontact');
var Gevent = require('../../models/gevent');
var Gmessage = require('../../models/gmessage');
var currentTime = new Date();

//=============== Get all Contacts Controller Sorted By Contact Date=============================

function getContactsAllContactDate (req, res) {
  var id = req.params.id;

  Gcontact.find({'user': id}).sort('contactLastInteraction.LatestInteractionOverall').exec(callbackContactDate);

  function callbackContactDate (error, contacts) {
    if(error) res.json({message: 'Could not find contacts b/c:' + error});
    res.json(contacts)
  };

}


//=============== Get all Contacts Controller Sorted By Alphabetical=============================

function getContactsAllAlpha(req, res) {
  var id = req.params.id;

  Gcontact.find({'user': id}).sort('contactname').exec(callbackAlpha);

  function callbackAlpha (error, contacts) {
    if(error) res.json({message: 'Could not find contacts b/c:' + error});
    res.json(contacts)
  };

}

//=============== Get all Events Controller Sorted By Last Date=============================

function getEventsAll(req, res) {
  var id = req.params.id;
  Gevent.find({'user': id}).where('eventDate').gt(currentTime).sort('eventDate').exec(callbackEvents);

  function callbackEvents (error, events) {
    if(error) res.json({message: 'Could not find contacts b/c:' + error});
    res.json(events)
  };

}

//=============== Get all Messages Controller Sorted By Recent=============================

function getMessagesAll(req, res) {
  var id = req.params.id;
  Gmessage.find({'user': id}).sort('messageDate').exec(callbackMessages);

  function callbackMessages (error, messages) {
    if(error) res.json({message: 'Could not find contacts b/c:' + error});
    res.json(messages)
  };

}


//=============== Get Contact Details =============================

function getContactDetails(req, res) {

  var contactDetailsJson = {};
  var messageSummary = [];
  var eventSummary = [];

  var id = req.params.id;
  var contactid = req.params.contactid;

  Gcontact.find({'user': id, '_id': contactid}, function(error,contactDetails){
    contactDetailsJson.contactid                = contactDetails[0]._id;
    contactDetailsJson.userid                   = contactDetails[0].user;
    contactDetailsJson.contactname              = contactDetails[0].contactname;
    contactDetailsJson.contactEmail             = contactDetails[0].contactEmail;
    contactDetailsJson.contactPhone             = contactDetails[0].contactPhone;
    contactDetailsJson.contactLastInteraction   = contactDetails[0].contactLastInteraction;

    Gmessage.find({'user': id, 'gcontacts': contactid}).sort('messageDate').exec(callbackMessages2);
    function callbackMessages2 (error, messagesOfContact){
      for (let z=0; z<messagesOfContact.length; z++){
          var oneMessageDetails = {};
          oneMessageDetails.messageDate         = messagesOfContact[z].messageDate;
          oneMessageDetails.messageSummary      = messagesOfContact[z].messageSubject;
          messageSummary.push(oneMessageDetails);
      }
      contactDetailsJson.messages               = messageSummary;
    }

    Gevent.find({'user': id, 'gcontacts': contactid}).sort('eventDate').exec(callbackEvent2);
    function callbackEvent2 (error, eventsOfContact){
      for (let y=0; y<eventsOfContact.length; y++){
          var oneEventDetails = {};
          oneEventDetails.eventDate             = eventsOfContact[y].eventDate;
          oneEventDetails.eventSummary          = eventsOfContact[y].eventSummary;
          eventSummary.push(oneEventDetails);
      }
      contactDetailsJson.events                 = eventSummary;
      res.json(contactDetailsJson)
    }
  })
}





//=============== Setup Last Contact Controller =============================

function lastContact(req, res) {

  var lastContactEventDate
  var lastContactMessageDate
  var lastContactDateCombined

  var id = req.params.id;

  Gcontact.find({'user': id}, function(error,contactsOfUser){

    for(let x=0; x<contactsOfUser.length; x++) {

      //Check last event that contact was met
      Gevent.find({'user': id, 'gcontacts': contactsOfUser[x]._id}).where('eventDate').lt(currentTime).sort('-EventDate').exec(callback1);

      function callback1(error, events) {
        // console.log('users ' + contactsOfUser[x].contactname)
        // console.log(events)

        if(error) res.json({message: 'Could not find events b/c:' + error});

        if(typeof events[0] != 'undefined'){

          Gcontact.findById(contactsOfUser[x]._id, function(err, contact){
            if (err) console.log(err)
            lastContactEventDate = events[events.length-1].eventDate;
            contact.contactLastInteraction.Meeting = lastContactEventDate

            contact.save(function(err, gmessage){
              if(err) return done(err);
            })
          })
        }
      };

      //Check last message that user sent contact an email
      Gmessage.find({'user': id, 'gcontacts': contactsOfUser[x]._id}).where('messageDate').lt(currentTime).sort('-messageDate').exec(callback2);

      function callback2(error, messagesX) {
        // console.log('users ' + contactsOfUser[x].contactname)
        // console.log(messagesX)

        if(error) res.json({message: 'Could not find message b/c:' + error});

        if(typeof messagesX[0] != 'undefined'){

          Gcontact.findById(contactsOfUser[x]._id, function(err, contact){
            if (err) console.log(err)
            lastContactMessageDate = messagesX[messagesX.length-1].messageDate;
            contact.contactLastInteraction.Email = lastContactMessageDate

            contact.save(function(err, gmessage){
              if(err) return done(err);
            })

          })
        }
      };

      Gcontact.findById(contactsOfUser[x]._id, function(err, contact){
        if (err) console.log(err)
        console.log("checking last interaction")
        if (contact.contactLastInteraction.Email - contact.contactLastInteraction.Meeting < 0){
          contact.contactLastInteraction.LatestInteractionOverall = contact.contactLastInteraction.Meeting
        }

        if (contact.contactLastInteraction.Email - contact.contactLastInteraction.Meeting > 0){
          contact.contactLastInteraction.LatestInteractionOverall = contact.contactLastInteraction.Email
        }
        else {
          if (typeof contact.contactLastInteraction.Email != 'undefined'){
            contact.contactLastInteraction.LatestInteractionOverall = contact.contactLastInteraction.Email
          }
          if (typeof contact.contactLastInteraction.Meeting != 'undefined'){
            contact.contactLastInteraction.LatestInteractionOverall = contact.contactLastInteraction.Meeting
          };
        }
        contact.save(function(err, gmessage){
          if(err) return done(err);
        })

      })

    }
    res.redirect('http://localhost:3001/home/?id='+id+'&')    
  })

}


module.exports = {
  getContactsAllContactDate: getContactsAllContactDate,
  getContactsAllAlpha:  getContactsAllAlpha,
  getEventsAll: getEventsAll,
  getMessagesAll: getMessagesAll,
  lastContact : lastContact,
  getContactDetails : getContactDetails
}
