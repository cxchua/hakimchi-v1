const User = require('../models/user')
const LocalStrategy = require('passport-local').Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy
const request = require('request')
const request2 = require('request-json')
var google = require('googleapis');
var client = request2.createClient('http://localhost:3000/');

// const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
// const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET

module.exports = function (passport) {
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

  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, function (req, email, password, done) {
    User.findOne({ 'email': email }, function (err, user) {
      if (err) return done(err)
      if (user) {
        return done(null, false, req.flash('errorMessage', 'This email is already used!'))
      } else {
        var newUser = new User()
        newUser.email = email
        newUser.local.password = User.encrypt(password)

        newUser.save(function (err, user) {
          if (err) return done(err)
          return done(null, user)
        })
      }
    })
  }))

  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, function (req, email, password, done) {
    User.findOne({ 'email': email }, function (err, user) {
      if (err) {
        return done(err)
      }

      if (!user) {
        return done(null, false, req.flash('errorMessage', 'No user found!'))
      }

      if (!user.validPassword(password)) {
        return done(null, false, req.flash('errorMessage', 'Incorrect Password'))
      }

      done(null, user)
    })
  }))

  passport.use('google', new GoogleStrategy({
    clientID: '266175055372-fvrdomie0qlg3kecntp32ub090oraj05.apps.googleusercontent.com',
    clientSecret: 'avYamacln1oZ7mlJpGcsfeLL',
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: ['profile','https://www.googleapis.com/auth/calendar.readonly','https://www.googleapis.com/auth/gmail.readonly','https://www.google.com/m8/feeds/']
  },
  function(accessToken, refreshToken, profile, cb) {
      // console.log(accessToken);
      cb(null,profile,{message:accessToken})
      console.log("Access Token:" + accessToken)
      //Calling for contacts data
      request("https://www.google.com/m8/feeds/contacts/default/full?alt=json&start-index=1&max-results=1000&access_token="+accessToken,function(error,response,body){
        var bodyX = JSON.parse(body);
        console.log('CONTACTS:')
        for(i=0; i<bodyX.feed.entry.length; i++){
          console.log('Name:' + bodyX.feed.entry[i].title.$t);
          console.log('Email:' + bodyX.feed.entry[i].gd$email[0].address);
        }
      })
      //Calling for calendar data
      // request("https://www.googleapis.com/calendar/v3/calendars/primary/events?alt=json&start-index=1&max-results=10&access_token="+accessToken,function(error,response,body){
      //   var bodyX = JSON.parse(body);
      //   console.log('CALENDAR EVENTS:')
      //   for(i=0; i<bodyX.items.length; i++){
      //     console.log(bodyX.items[i].start.dateTime)
      //     console.log('Summary:' + bodyX.items[i].summary)
      //   }
      // })

      // //Calling for mail data - message
      // request("https://www.googleapis.com/gmail/v1/users/me/messages?alt=json&start-index=1&max-results=10&access_token="+accessToken,function(error,response,body){
      //   var bodyX = JSON.parse(body);
      //   console.log('MESSAGE DATA:')
      //   for(i=0; i<bodyX.messages.length; i++){
      //     var urlY = ('https://www.googleapis.com/gmail/v1/users/me/messages/'+ (bodyX.messages[i].id) + '?alt=json&start-index=1&max-results=10&access_token=' + accessToken)
      //     request(urlY,function(error,response,body){
      //       var bodyY = JSON.parse(body);
      //       console.log('Message ID:' + bodyY.id)
      //       // console.log('Headers:' + bodyY.payload.headers.length)
      //       for (j=0; j<bodyY.payload.headers.length; j++){
      //         if(bodyY.payload.headers[j].name==="Date") {console.log('Date:' + bodyY.payload.headers[j].value)}
      //         if(bodyY.payload.headers[j].name==="From") {
      //           var fullFromString = bodyY.payload.headers[j].value
      //           if(fullFromString.indexOf("<") > 0){
      //             var emailOnly = fullFromString.substring(fullFromString.lastIndexOf("<")+1,fullFromString.lastIndexOf(">"))
      //             console.log('From:' + emailOnly)
      //           }
      //           else {console.log('From:' + fullFromString)}
      //         }
      //         if(bodyY.payload.headers[j].name==="Subject") {console.log('Subject:' + bodyY.payload.headers[j].value)}
      //       }
      //     })
      //   }
      // })





      //// Using request-json instead for contacts
      // client.get("https://www.google.com/m8/feeds/contacts/default/full?alt=json&access_token="+accessToken, function(err, res, body) {
      //   for(i=0; i<body.feed.entry.length; i++){
      //     console.log(body.feed.entry[i].title.$t);
      //     console.log(body.feed.entry[i].gd$email[0].address);
      //   }
      // });



      // User.findOrCreate({ googleId: profile.id }, function (err, user) {
      //   return cb(err, user);
      // });
    }
))

  // passport.use('github', new GitHubStrategy({
  //   clientID: GITHUB_CLIENT_ID,
  //   clientSecret: GITHUB_CLIENT_SECRET,
  //   callbackURL: 'http://devhub-.herokuapp.com/auth/github/callback'
  // },
  //   function (access_token, refresh_token, profile, done) {
  //     User.findOne({ 'email': profile._json.email }, function (err, user) {
  //       if (err) {
  //         console.log(err) // handle errors!
  //       }
  //       if (!err && user !== null) {
  //         done(null, user)
  //       } else {
  //         var newUser = new User()
  //         newUser.github.id = profile._json.id
  //         newUser.github.username = profile._json.login
  //         newUser.email = profile._json.email
  //         newUser.github.location = profile._json.location
  //         newUser.github.hireable = profile._json.hireable
  //         newUser.github.company = profile._json.company
  //         newUser.github.blog = profile._json.blog
  //         newUser.github.bio = profile._json.bio
  //         newUser.github.avatar_url = profile._json.avatar_url
  //         newUser.github.html_url = profile._json.html_url
  //         newUser.github.followers = profile._json.followers
  //         newUser.github.disk_usage = profile._json.disk_usage
  //         newUser.github.access_token = access_token
  //         newUser.github.refresh_token = refresh_token
  //         newUser.github.name = profile._json.name
  //         newUser.profiled = false
  //
  //         newUser.save(function (err) {
  //           var user = newUser
  //           if (err) {
  //             console.log(err) // handle errors!
  //           } else {
  //             console.log('saving user')
  //             done(null, user)
  //           }
  //         })
  //       }
  //     })
  //   }
  // ))
}
