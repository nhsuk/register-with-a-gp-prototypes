// Use this file to change prototype configuration.

// Note: prototype config can be overridden using environment variables (eg on heroku)

module.exports = {
  serviceName: 'Register with a GP',
  practiceName: 'Field Way Practice',
  practiceAddress: [
    '8 Gloucestershire Avenue',
    'Barnfeed',
    'Sheffield'
  ],
  practicePostcode: 'SH22 9AB',
  practiceTelephone: '0123 456 7890',

  // Default port that prototype runs on
  port: '3000',

  // Enable or disable password protection on production
  useAuth: 'true',

  // Force HTTP to redirect to HTTPs on production
  useHttps: 'true',

  // Cookie warning - update link to service's cookie page.
  cookieText: 'We use cookies to make this site simpler. <a href="#" title="Find out more about cookies">Find out more about cookies</a>'

}
