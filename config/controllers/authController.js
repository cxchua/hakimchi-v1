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
      setTimeout(res.redirect('/api/lastcontact/'+user._id),6000)
    })
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
