# Register with a GP prototypes
Design prototypes for Register with a GP project

Note this is prototype code. Not intended for production use.

## 1: What you need for local development

There are two Github repos you need.

The main app for Register with a GP prototypes (this repo):

`https://github.com/nhsuk/register-with-a-gp-prototypes`

The GP Lookup app, used to perform the ‘Find your GP’ lookup functionality (via CORS):

`https://github.com/nhsuk/gp-lookup`

### Downloading and running `gp-lookup`:

Make sure you’ve got a suitable version of Ruby, and Bundler (have fun). Clone the directory then:

`bundle install`

Once that’s done, start the app with an environment variable like this:

`ALLOWED_ORIGINS=http://localhost:3000 bundle exec rackup`

This app should now be running happily. You can use it at [http://localhost:9292](http://localhost:9292).

### Downloading and running register-with-a-gp-prototypes:

Clone the directory then:

`npm install`

You also need to create a plain text `.env` file in the root of the app containing the following environment variables:

```
GP_LOOKUP_URL='http://localhost:9292'
GOOGLE_MAPS_API_KEY='the-key-value'
POSTCODE_API='the-key-value'
```

(Get the keys you need from one of the contributors on this repo)

Once that’s done, run the app with:

`grunt`

This app should now be running happily, and be able to talk to your local running copy of `gp-lookup`. Use it at [http://localhost:3000](http://localhost:3000).

For the ‘find your GP’ feature to work when using the Register with a GP prototypes, you *must* have gp-finder running at the same time.


## 2: Structure of the ‘Register with a GP’ prototype

### Routes, views and server.js

Each version of the prototype (as you’ll see in the index page https://register-with-a-gp-prototypes.herokuapp.com) has its own routes file and views folder living in `/app`:

For example, if you’re looking at http://localhost:3000/mvp-v1.3/gp-details you’re using the `/app/routes/mvp.v1.3.js` file and the `/app/views/mvp_v1_3` folder.

This is all joined up in the `/server.js` file. Starting at line 14, the routes files are required. In our `mvp.v1.3` example, on line 20 that’s:

`var mvp_v1_3 = require('./app/routes/mvp.v1.3');`

Further down, from line 107 the app is then instructed to use those routes. Again, in our example, on line 113 that’s:

`app.use('/mvp-v1.3', mvp_v1_3);`

Basically we’re importing all the code in the routes file, and then telling the server to refer to that code when it gets a request along the lines of `/mvp-v1.3/*`


### Creating a new iteration

So you might want to build vision v1.1 or mvp 1.5 - here’s how.

Create a new route file and edit the routes inside. For instance, if I’m building MVP 1.5, I will take a copy of `/app/routes/mvp.v1.4.js` and name it `mvp.v1.5.js`

Inside `mvp.v1.5.js` I will do a find and replace as follows:

Find: `'mvp_v1_4/`
Replace: `'mvp_v1_5/`

Next up is views. I take a copy of the whole `/app/views/mvp_v1_4` folder and name it `mvp_v1_5`

I tie all this together in `/server.js` as follows:

Require the routes file (around lines 14 - 22) by adding: `var mvp_v1_5 = require('./app/routes/mvp.v1.5');`
Then use the routes (around lines 107 - 118) by adding: `app.use('/mvp-v1.5', mvp_v1_5);`

You might need to restart the server. The new MVP 1.5  iteration in the app will then be available under `http://localhost:3000/mvp.v1.5/*`

Finally I manually add a link to the new iteration in `/views/index.html`

### The routes files

A very quick bit about the way the routes files are laid out.

The request patterns follow the order of the interaction in the prototype, so it’s starting page through to end page in that order.

Within each single route - for example `/name` - the first hook is for get requests, and the second is for post

Every form submission going through the process builds up a session, which is constantly played back in the terminal window running the app. You’ll be able to see the structure of the session object get built up as you go through.

## 3: Dependencies, APIs, etc
### GP lookup functionality

For local development, you need the gp-finder app running as documented above. On Heroku, the https://register-with-a-gp-prototypes.herokuapp.com app does CORS to http://gp-lookup-demo.herokuapp.com so that should be pain free.

### Postcode lookup functionality

The sections where we do address lookups use the https://getaddress.io API service. It uses the `POSTCODE_API` key in the `.env` file locally (details above).

### Google maps

There’s a simple API key, again in the `.env` file locally (details above).

## 4: Remote - Github and Heroku

The Heroku app is https://register-with-a-gp-prototypes.herokuapp.com

It’s protected with a username and password. Again, check with a collaborator what this is.

The Heroku deploy is automated from Github. Every pull request generates a preview app, every update to master generates a deploy.

If you’ve been added as a collaborator on Heroku, you should see the `register-with-a-gp-pipeline` where this is all set up.
