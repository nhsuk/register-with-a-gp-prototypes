var express = require('express')
var router = express.Router()

var request = require('request')
var naturalSort = require('javascript-natural-sort')
var postcode_api = process.env.POSTCODE_API

// V1 prototype. Sprints 0-3. Simple recreation of GMS1

// URL structure is /v1/ROUTE

// Start page ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/start', function (req, res) {
  req.session.destroy();
  res.render('v1/start', {
    suppressServiceName: true
  });
});

// Name ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/name', function (req, res) {
  res.render('v1/name', {
    session: req.session
  });
});

router.post('/name', function (req, res) {

  var passed = true;
  var errors = {};

  req.session.name = {
    'firstName': req.body['first-name'],
    'middleNames': req.body['middle-names'],
    'lastName': req.body['last-name'],
    'nameChanged': req.body['name-changed'],
    'firstNamePrev': req.body['first-name-previous'],
    'middleNamesPrev': req.body['middle-names-previous'],
    'lastNamePrev': req.body['last-name-previous']
  };

  if (req.body['first-name'] === '' || req.body['last-name'] === '') {
    errors['name'] = 'Please enter your full name';
    passed = false;
  }

  if (!req.body['name-changed']) {
    errors['name-changed'] = 'Please answer this question';
    passed = false;
  }

  if (req.body['name-changed'] === 'yes' && !req.body['first-name-previous'] && !req.body['last-name-previous']) {
    errors['previous-name'] = 'Please enter your previous name';
    passed = false;
  }

  if (passed === false) {
    res.render('v1/name', {
      errors,
      session: req.session
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('date-of-birth')
    }
  }

})

// DOB +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/date-of-birth', function (req, res) {
  res.render('v1/date-of-birth', {
    session: req.session
  });
});

router.post('/date-of-birth', function (req, res) {

  req.session.dob = {
    'day': req.body['dob-day'],
    'month': req.body['dob-month'],
    'year': req.body['dob-year']
  };

  if (req.body['dob-day'] === '' || req.body['dob-month'] === '' || req.body['dob-year'] === '') {
    res.render('v1/date-of-birth', {
      error: 'Please enter your date of birth',
      session: req.session
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('home-address')
    }
  }
})

// Postcode ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/home-address', function (req, res) {
  res.render('v1/home-address-postcode', {
    session: req.session
  });
});

router.post('/home-address', function (req, res) {

  req.session.postcode = req.body['postcode'];
  req.session.building = req.body['building'];

  if (req.body['postcode'] === '') {
    res.render('v1/home-address-postcode', {
      session: req.session,
      error: {
        postcode: 'Please enter your home postcode'
      }
    });
  } else {
    // strip spaces
    var cleaned = req.session.postcode.replace(/\s+/g, '').toLowerCase();

    request('https://api.getAddress.io/v2/uk/' + cleaned + '/?api-key=' + postcode_api + '&format=true', function (error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          var parsed = JSON.parse(body);
          var addresses = parsed['Addresses'];
          addresses.sort(naturalSort);
          var filtered = [];

          if (req.session.building !== '') {
            for (var i=0; i<addresses.length; i++) {
              //var current = addresses[i][0];
              var current = addresses[i].toString().toLowerCase();
              if (current.indexOf(req.session.building.toLowerCase()) !== -1) {
                filtered.push(addresses[i]);
              }
            }

            if (filtered.length === 0) {
              // Nothing found for this combo of building / postcode
              // So just display the postcode results?
              req.session.addressResults = addresses;
              res.render('v1/home-address-result', {
                message: 'No exact match has been found, showing all addresses for ' + req.session.postcode,
                session: req.session
              });
            } else {
              req.session.addressResults = filtered;
              res.render('v1/home-address-result', {
                session: req.session
              });
            }

          } else {

            req.session.addressResults = addresses;

            res.render('v1/home-address-result', {
              session: req.session
            });

          }
        }

      } else {
        res.render('v1/home-address-postcode', {
          error: {
            general: 'Sorry, there’s been a problem looking up your address. Please try again.'
          },
          session: req.session
        });
      }
    });
  }
})

// Address selection +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/select-address', function (req, res) {
  res.render('v1/select-address', {
    session: req.session
  });
});

router.post('/select-address', function (req, res) {

  if (!req.body['address']) {
    res.render('v1/home-address-result', {
      error: 'Please select your home address',
      session: req.session
    });
  } else {
    req.session.address = req.body['address'].split(',');
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('contact-details')
    }
  }
})

// Manual address entry ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/home-address-manual', function (req, res) {
  res.render('v1/home-address-manual', {
    session: req.session
  });
});

router.post('/home-address-manual', function (req, res) {

  req.session.address = [
    req.body['address-1'],
    req.body['address-2'],
    req.body['address-3'],
    req.body['address-4']
  ];
  req.session.postcode = req.body['postcode'];

  if (!req.body['address-1'] && !req.body['address-4']) {
    res.render('v1/home-address-manual', {
      error: 'Please enter your full address',
      session: req.session
    });
  } else if (req.session.edit === true) {
    res.redirect('confirm-details')
  } else {
    res.redirect('contact-details')
  }

})

// Contact details +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/contact-details', function (req, res) {
  res.render('v1/contact-details', {
    session: req.session
  });
});

router.post('/contact-details', function (req, res) {

  req.session.contact = {
    telephone: req.body['telephone'],
    email: req.body['email']
  }

  if (req.body['telephone'] === '' && req.body['email'] === '') {
    res.render('v1/contact-details', {
      error: 'Please enter at least one'
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('nhs-number')
    }
  }
})

// NHS Number ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/nhs-number', function (req, res) {
  res.render('v1/nhs-number', {
    session: req.session
  });
})

router.post('/nhs-number', function (req, res) {

  var passed = true;
  var errors = {};

  req.session.nhsnumber = {
    known: req.body['nhs-number-known'],
    number: req.body['nhs-number']
  }

  if (!req.body['nhs-number-known']) {
    passed = false;
    errors = {
      known: 'Please answer ‘yes’ or ‘no’',
      number: ''
    }
  }

  if (req.body['nhs-number-known'] === 'yes' && req.body['nhs-number'] === '') {
    passed = false;
    errors = {
      known: '',
      number: 'Please enter your NHS number'
    }
  }

  if (req.body['nhs-number-known'] === 'no') {
    req.session.nhsnumber.number = '';
  }

  if (passed === false) {
    res.render('v1/nhs-number', {
      session: req.session,
      errors: errors
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('current-gp')
    }
  }

})

// Current GP ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/current-gp', function (req, res) {
  res.render('v1/current-gp', {
    session: req.session
  });
})

router.post('/current-gp', function (req, res) {

  var passed = true;
  var errors = {};

  req.session.currentgp = {
    registered: req.body['current-gp'],
    name: req.body['current-gp-name'],
    address: req.body['current-gp-address']
  }

  if (!req.body['current-gp']) {
    passed = false;
    errors = {
      registered: 'Please answer ‘yes’ or ‘no’',
      details: ''
    }
  }

  if (req.body['current-gp'] === 'yes' && req.body['current-gp-name'] === '' && req.body['current-gp-address'] === '') {
    passed = false;
    errors = {
      registered: '',
      details: 'Please enter as much detail as you can about your current GP'
    }
  }

  if (passed === false) {
    res.render('v1/current-gp', {
      session: req.session,
      errors: errors
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('previous-address')
    }
  }

});

// Previous address ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/previous-address', function (req, res) {
  res.render('v1/previous-address', {
    session: req.session
  });
})

router.post('/previous-address', function (req, res) {

  var passed = true;
  var errors = {};

  req.session.prevaddress = req.body['prev-address'];

  if (!req.body['prev-address']) {
    passed = false;
    error = 'Please answer ‘yes’ or ‘no’';
  }

  if (passed === false) {
    res.render('v1/previous-address', {
      session: req.session,
      error: error
    });
  } else if (req.body['prev-address'] === 'yes') {
    res.redirect('previous-address-postcode')
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('armed-forces')
    }
  }

});

// Previous address - find +++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/previous-address-postcode', function (req, res) {
  res.render('v1/previous-address-postcode', {
    session: req.session
  });
});

router.post('/previous-address-postcode', function (req, res) {

  req.session.prevpostcode = req.body['postcode'];
  req.session.prevbuilding = req.body['building'];

  if (req.body['postcode'] === '') {
    res.render('v1/previous-address-postcode', {
      session: req.session,
      error: {
        postcode: 'Please enter your previous home postcode'
      }
    });
  } else {
    // strip spaces
    var cleaned = req.session.prevpostcode.replace(/\s+/g, '').toLowerCase();

    request('https://api.getAddress.io/v2/uk/' + cleaned + '/?api-key=' + postcode_api + '&format=true', function (error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          var parsed = JSON.parse(body);
          var addresses = parsed['Addresses'];
          addresses.sort(naturalSort);
          var filtered = [];

          if (req.session.prevpostcode !== '') {
            for (var i=0; i<addresses.length; i++) {
              //var current = addresses[i][0];
              var current = addresses[i].toString().toLowerCase();
              if (current.indexOf(req.session.prevbuilding.toLowerCase()) !== -1) {
                filtered.push(addresses[i]);
              }
            }

            if (filtered.length === 0) {
              // Nothing found for this combo of building / postcode
              // So just display the postcode results?
              req.session.prevAddressResults = addresses;
              res.render('v1/previous-address-result', {
                message: 'No exact match has been found, showing all addresses for ' + req.session.prevpostcode,
                session: req.session
              });
            } else {
              req.session.prevAddressResults = filtered;
              res.render('v1/previous-address-result', {
                session: req.session
              });
            }

          } else {

            req.session.prevAddressResults = addresses;

            res.render('v1/previous-address-result', {
              session: req.session
            });

          }
        }

      } else {
        res.render('v1/previous-address-postcode', {
          error: {
            general: 'Sorry, there’s been a problem looking up your address. Please try again.'
          },
          session: req.session
        });
      }
    });
  }
})

// Previous address selection ++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/select-previous-address', function (req, res) {
  res.render('v1/select-previous-address', {
    session: req.session
  });
});

router.post('/select-previous-address', function (req, res) {

  if (!req.body['address']) {
    res.render('v1/previous-address-result', {
      error: 'Please select your home address',
        session: req.session
    });
  } else {
    req.session.prevAddress = req.body['address'].split(',');
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('armed-forces')
    }
  }
})

// Leaving the armed forces? +++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/armed-forces', function (req, res) {
  res.render('v1/armed-forces', {
    session: req.session
  });
});

router.post('/armed-forces', function (req, res) {

  var passed = true;
  var errors = {};

  req.session.armedforces = {
    leaving: req.body['armed-forces'],
    serviceno: req.body['service-no'],
    enlistment: {
      day: req.body['enlistment-day'],
      month: req.body['enlistment-month'],
      year: req.body['enlistment-year']
    }
  }

  if (!req.body['armed-forces']) {
    passed = false;
    error = 'Please answer ‘yes’ or ‘no’';
  }

  if (req.body['armed-forces'] === 'no') {
    req.session.armedforces.serviceno = '';
    req.session.armedforces.enlistment = {
      day: '',
      month: '',
      year: ''
    };
  }

  if (passed === false) {
    res.render('v1/armed-forces', {
      session: req.session,
      error: error
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('from-abroad')
    }
  }

});

// From abroad? ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/from-abroad', function (req, res) {
  res.render('v1/from-abroad', {
    session: req.session
  });
});

router.post('/from-abroad', function (req, res) {

  var passed = true;
  var errors = {};

  req.session.abroad = {
    boolean: req.body['abroad'],
    arrival: {
      day: req.body['arrival-day'],
      month: req.body['arrival-month'],
      year: req.body['arrival-year']
    },
    leaving: {
      day: req.body['leaving-day'],
      month: req.body['leaving-month'],
      year: req.body['leaving-year']
    }
  }

  if (!req.body['abroad']) {
    passed = false;
    error = 'Please answer ‘yes’ or ‘no’';
  }

  if (req.body['abroad'] === 'no') {
    req.session.abroad.arrival = {
      day: '',
      month: '',
      year: ''
    },
    req.session.abroad.leaving = {
      day: '',
      month: '',
      year: ''
    }
  }

  if (passed === false) {
    res.render('v1/from-abroad', {
      session: req.session,
      error: error
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('confirm-details')
    }
  }

});

// Check your answers ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/confirm-details', function (req, res) {
  req.session.edit = true;
  res.render('v1/confirm-details', {
    session: req.session
  });
});

// Registration submitted ++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/registration-submitted', function (req, res) {
  req.session.edit = false;
  res.render('v1/registration-submitted', {
    session: req.session
  });
});

module.exports = router
