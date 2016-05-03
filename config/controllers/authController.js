const passport = require('passport')
const request = require('request')
// const createProfile = require('./createProfile')

function goGoogle (req, res) {
  return passport.authenticate('google')(req, res)
}

function googleCallback (req, res) {
  // console.log(res)
  return passport.authenticate('google', function (err, user, info) {
    if (err) throw err
    req.logIn(user, function (err) {
      if (err) throw err
      // console.log(user)
      // console.log('From googleCallback' + info.accesstoken);
      // request("https://www.google.com/m8/feeds/contacts/default/full?alt=json&access_token="+info.accesstoken,function(error,response,body){
      //   console.log('This is the body from contacts' + body);
      //
      // })
      // createProfile(req, res, function () {
      //   res.redirect('/users/' + user.github.username)
      // })
    })
    res.send("Hey")
  })(req, res)
}

// GET /logout
function getLogout (req, res) {
  req.session.destroy(function (err) {
    res.redirect('/') // Inside a callback… bulletproof!
  })
}

module.exports = {
  getLogout: getLogout,
  goGoogle: goGoogle,
  googleCallback: googleCallback
}
