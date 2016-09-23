var path = require('path')
var express = require('express')
var favicon = require('serve-favicon')
var nunjucks = require('nunjucks')
var routes = require('./app/routes.js')
var bodyParser = require('body-parser')
var utils = require('./lib/utils.js')
var config = require('./app/config.js')

var app = express()

// Grab environment variables specified in Procfile or as Heroku config vars
var username = process.env.USERNAME
var password = process.env.PASSWORD
var env = process.env.NODE_ENV || 'development'
var useAuth = process.env.USE_AUTH || config.useAuth
var useHttps = process.env.USE_HTTPS || config.useHttps

env = env.toLowerCase()
useAuth = useAuth.toLowerCase()
useHttps = useHttps.toLowerCase()

// Authenticate against the environment-provided credentials, if running
// the app in production (Heroku, effectively)
if (env === 'production' && useAuth === 'true') {
  app.use(utils.basicAuth(username, password))
}

// Add variables that are available in all views
app.use(function (req, res, next) {
  res.locals.serviceName = config.serviceName
  res.locals.cookieText = config.cookieText
  next()
})

// Middleware to serve static assets
app.use('/public', express.static(path.join(__dirname, '/public')))

// Application settings
app.set('view engine', 'html')

app.use('/', routes);

nunjucks.configure('./app/views', {
    autoescape: true,
    express: app,
    noCache: true
});

// Force HTTPs on production connections
if (env === 'production' && useHttps === 'true') {
  app.use(utils.forceHttps)
}

// Disallow search index
app.use(function (req, res, next) {
  // Setting headers stops pages being indexed even if indexed pages link to them.
  res.setHeader('X-Robots-Tag', 'noindex')
  next()
})

app.get('/robots.txt', function (req, res) {
  res.type('text/plain')
  res.send('User-agent: *\nDisallow: /')
})

// start the app
utils.findAvailablePort(app, function (port) {
  console.log('Listening on port ' + port + '   url: http://localhost:' + port)
  app.listen(port)
})
