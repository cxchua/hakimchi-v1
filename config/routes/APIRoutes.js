'use strict'

var express     = require('express');
var router      = express.Router();
var passport    = require("passport");


//Reference to individual controller files
var APIController      = require('../controllers/APIController')

function authenticatedUser(req, res, next){
    if (req.isAuthenticated()) return next();
    req.flash('errorMessage', "Login to access");
    res.redirect('/login');
}

/*
 * Note: Please place the routes for a particular controller
 * under its corresponding section below
 */

//=============== API Routes Controller =============================

router.route('/api/contacts-date/:id')
    .get(APIController.getContactsAllContactDate)


router.route('/api/contacts-alpha/:id')
    .get(APIController.getContactsAllAlpha)


router.route('/api/events/:id')
    .get(APIController.getEventsAll)


router.route('/api/messages/:id')
    .get(APIController.getMessagesAll)

// generate last interaction date for all contacts of user
router.route('/api/lastcontact/:id')
    .get(APIController.lastContact)

// generate last interaction date for all contacts of user
router.route('/api/getcontactdetails/:id/:contactid')
    .get(APIController.getContactDetails)



//================ End of Routes =======================================


module.exports = router
