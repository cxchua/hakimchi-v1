const express = require('express')
const app = express()
const path = require('path')
const logger = require('morgan')
const mongoose = require('mongoose')
const passport = require('passport')
const flash = require('connect-flash')
const ejsLayouts = require('express-ejs-layouts')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const methodOverride = require('method-override')
const expressJWT = require('express-jwt')
var dotenv = require('dotenv');
dotenv.load();
const GOOGLE_API_CLIENT_ID = process.env.GOOGLE_API_CLIENT_ID;
const GOOGLE_API_CLIENT_SECRET = process.env.GOOGLE_API_CLIENT_SECRET;

//route definitions
const loginRoutes = require(__dirname + '/config/routes/loginRoutes')
const APIRoutes = require(__dirname + '/config/routes/APIRoutes');

//setup mongoDB
const mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/Hakimchi'
const port = process.env.PORT || 3000
mongoose.connect(mongoUri)


//setup port listener
app.listen(port, function () {
  console.log('server listening on port ' + port)
})

//middleware
app.use(logger('dev'))
app.use(morgan('dev'))
app.use(cookieParser())
app.use(bodyParser())
app.use(bodyParser.urlencoded({extend: true}))
// app.use(session({secret: "Hakimchiii"}))
app.use(passport.initialize())
// app.use(passport.session())
app.use(flash())
app.use(methodOverride('_method'))

require('./config/passport')(passport)

app.use(function (req, res, next) {
  global.currentUser = req.user
  next()
})


// view engine setup and middleware for public folder
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'))
app.engine('ejs', require('ejs').renderFile)
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))
app.use(ejsLayouts)

// app.use('/api', expressJWT({secret: "Hakimchiii"}));
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});




// routes and controllers middleware
app.use(loginRoutes)
app.use(APIRoutes)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
