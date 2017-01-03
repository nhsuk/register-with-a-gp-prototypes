require('dotenv').config();

var path = require('path')
var express = require('express')
var session = require('express-session')
var favicon = require('serve-favicon')
var nunjucks = require('nunjucks')
var dateFilter = require('nunjucks-date-filter')
var request = require('request')
var bodyParser = require('body-parser')
var utils = require('./lib/utils.js')
var config = require('./app/config.js')

var index = require('./app/routes/index');
var v1 = require('./app/routes/v1');
var v1_1 = require('./app/routes/v1.1');
var mvp_v1 = require('./app/routes/mvp.v1');
var mvp_v1_1 = require('./app/routes/mvp.v1.1');
var mvp_v1_2 = require('./app/routes/mvp.v1.2');
var mvp_v1_3 = require('./app/routes/mvp.v1.3');
var vision_v1 = require('./app/routes/vision.v1');

var emails = require('./app/routes/emails');

var app = express()

// Grab environment variables specified in Procfile or as Heroku config vars
var username = process.env.USERNAME
var password = process.env.PASSWORD
var appEnvironment = process.env.NODE_ENV || 'development'
var useAuth = process.env.USE_AUTH || config.useAuth
var useHttps = process.env.USE_HTTPS || config.useHttps
var gpLookupURL = process.env.GP_LOOKUP_URL
var mapsKey = process.env.GOOGLE_MAPS_API_KEY

appEnvironment = appEnvironment.toLowerCase()
useAuth = useAuth.toLowerCase()
useHttps = useHttps.toLowerCase()

// Force HTTPs on production connections
if (appEnvironment === 'production' && useHttps === 'true') {
  app.use(utils.forceHttps)
}

// Authenticate against the environment-provided credentials, if running
// the app in production (Heroku, effectively)
if (appEnvironment === 'production' && useAuth === 'true') {
  app.use(utils.basicAuth(username, password))
}

// Disallow search index
app.use(function (req, res, next) {
  // Setting headers stops pages being indexed even if indexed pages link to them.
  res.setHeader('X-Robots-Tag', 'noindex')
  next()
})

// Support session data
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: Math.round(Math.random() * 100000).toString()
}))

// Add variables that are available in all views
app.use(function (req, res, next) {
  res.locals.serviceName = config.serviceName
  res.locals.practiceName = config.practiceName
  res.locals.practiceAddress = config.practiceAddress
  res.locals.practicePostcode = config.practicePostcode
  res.locals.practiceTelephone = config.practiceTelephone
  res.locals.practiceEmail = config.practiceEmail
  res.locals.cookieText = config.cookieText
  res.locals.session = req.session
  res.locals.gpLookupURL = gpLookupURL
  res.locals.mapsKey = mapsKey;
  res.locals.jsNow = new Date();
  next()
})

var myLogger = function (req, res, next) {
  console.log(req.session);
  next();
};
app.use(myLogger);

// Handle form POSTS
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

// Middleware to serve static assets
app.use('/', express.static(path.join(__dirname, '/public')))

// Application settings
app.set('view engine', 'html')

var env = nunjucks.configure('./app/views', {
    autoescape: true,
    express: app,
    noCache: true
});
env.addFilter('date', dateFilter);

app.use('/', index);
app.use('/v1', v1);
app.use('/v1.1', v1_1);
app.use('/mvp-v1', mvp_v1);
app.use('/mvp-v1.1', mvp_v1_1);
app.use('/mvp-v1.2', mvp_v1_2);
app.use('/mvp-v1.3', mvp_v1_3);

app.use('/vision-v1', vision_v1);

app.use('/emails', emails);

// auto render any view that exists
app.get(/^\/([^.]+)$/, function (req, res) {
  var path = (req.params[0])

  res.render(path, function (err, html) {
    if (err) {
      res.render(path + '/index', function (err2, html) {
        if (err2) {
          console.log(err)
          res.status(404).send(err + '<br>' + err2)
        } else {
          res.end(html)
        }
      })
    } else {
      res.end(html)
    }
  })
});

app.get('/robots.txt', function (req, res) {
  res.type('text/plain')
  res.send('User-agent: *\nDisallow: /')
})

// start the app
utils.findAvailablePort(app, function (port) {
  console.log('Listening on port ' + port + '   url: http://localhost:' + port)
  app.listen(port)
})
