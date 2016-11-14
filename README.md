# Register with a GP prototypes
Design prototypes for Register with a GP project

Note this is prototype code. Not intended for production use.

## Getting started
Clone this repo:
`git clone git@github.com:nhsuk/register-with-a-gp-prototypes.git`

Install the dependencies:
`npm install`

Start local development (Sass and Nodemon watching):
`grunt`

### Note: GP lookup functionality

This prototype uses the Alpha GP Lookup prototype to do lookups. At the moment
this is via CORS.

If you want to run everything locally:

Clone and set up https://github.com/nhsuk/gp-lookup as per the README

Start the `gp-lookup` app with:
`ALLOWED_ORIGINS=//localhost:3000 bundle exec rackup`

Start this prototype with:
`GP_LOOKUP_URL=//localhost:9292 grunt`
