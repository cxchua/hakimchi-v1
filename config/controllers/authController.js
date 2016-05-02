const passport = require('passport')
// const createProfile = require('./createProfile')

function goGoogle (req, res) {
  return passport.authenticate('google', { scope: ['profile','https://www.googleapis.com/auth/calendar.readonly','https://www.googleapis.com/auth/gmail.readonly'] })(req, res)
}

function googleCallback (req, res) {
  // console.log(res)
  return passport.authenticate('google', function (err, user, info) {
    if (err) throw err
    req.logIn(user, function (err) {
      if (err) throw err
      // console.log(user)
      console.log(info);
      res.json(user)
      // createProfile(req, res, function () {
      //   res.redirect('/users/' + user.github.username)
      // })
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
