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

//=============== API Routes to Products Controller ========================

// router.route('/api/contacts')
//     .get(APIController.getAll)

router.route('/api/contacts/:id')
    .get(APIController.getContact)


//================ End of Routes =======================================


module.exports = router
