var express = require('express')
var request = require('request')
var naturalSort = require('javascript-natural-sort')
var router = express.Router()

var postcode_api = process.env.POSTCODE_API

router.get('/', function (req, res) {
  req.session.destroy();
  res.render('index.html');
});

// Start page ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/start', function (req, res) {
  req.session.destroy();
  res.render('v1/start');
});

// Name ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/name', function (req, res) {
  console.log(req.session);
  res.render('v1/name', {
    name: req.session.name,
    edit: req.session.edit
  });
});

router.post('/v1/name', function (req, res) {

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
      name: req.session.name
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('/v1/confirm-details')
    } else {
      res.redirect('/v1/date-of-birth')
    }
  }

})

// DOB +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/date-of-birth', function (req, res) {
  res.render('v1/date-of-birth', {
    dob: req.session.dob,
    edit: req.session.edit
  });
});

router.post('/v1/date-of-birth', function (req, res) {

  req.session.dob = {
    'day': req.body['dob-day'],
    'month': req.body['dob-month'],
    'year': req.body['dob-year']
  };

  if (req.body['dob-day'] === '' || req.body['dob-month'] === '' || req.body['dob-year'] === '') {
    res.render('v1/date-of-birth', {
      error: 'Please enter your date of birth'
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('/v1/confirm-details')
    } else {
      res.redirect('/v1/home-address')
    }
  }
})

// Postcode ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/home-address', function (req, res) {
  res.render('v1/home-address-postcode', {
    postcode: req.session.postcode,
    building: req.session.building,
    edit: req.session.edit
  });
});

router.post('/v1/home-address', function (req, res) {

  req.session.postcode = req.body['postcode'];
  req.session.building = req.body['building'];

  if (req.body['postcode'] === '') {
    res.render('v1/home-address-postcode', {
      building: req.session.building,
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
                postcode: req.session.postcode,
                building: req.session.building,
                results: req.session.addressResults
              });
            } else {
              req.session.addressResults = filtered;
              res.render('v1/home-address-result', {
                postcode: req.session.postcode,
                building: req.session.building,
                results: req.session.addressResults
              });
            }

          } else {

            req.session.addressResults = addresses;

            res.render('v1/home-address-result', {
              postcode: req.session.postcode,
              building: req.session.building,
              results: req.session.addressResults
            });

          }
        }

      } else {
        res.render('v1/home-address-postcode', {
          error: {
            general: 'Sorry, there’s been a problem looking up your address. Please try again.'
          },
          postcode: req.session.postcode,
          building: req.session.building
        });
      }
    });
  }
})

// Address selection +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/select-address', function (req, res) {
  res.render('v1/select-address', {
    postcode: req.session.postcode,
    results: req.session.addressResults,
    edit: req.session.edit
  });
});

router.post('/v1/select-address', function (req, res) {

  if (!req.body['address']) {
    res.render('v1/home-address-result', {
      error: 'Please select your home address',
      building: req.session.building,
      postcode: req.session.postcode,
      results: req.session.addressResults
    });
  } else {
    req.session.address = req.body['address'].split(',');
    if (req.session.edit === true) {
      res.redirect('/v1/confirm-details')
    } else {
      res.redirect('/v1/contact-details')
    }
  }
})

// Contact details +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/contact-details', function (req, res) {
  res.render('v1/contact-details', {
    contact: req.session.contact,
    edit: req.session.edit
  });
});

router.post('/v1/contact-details', function (req, res) {

  req.session.contact = {
    telephone: req.body['telephone'],
    mobile: req.body['mobile'],
    email: req.body['email']
  }

  if (req.body['telephone'] === '' && req.body['mobile'] === '' && req.body['email'] === '') {
    res.render('v1/contact-details', {
      error: 'Please enter at least one'
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('/v1/confirm-details')
    } else {
      res.redirect('/v1/nhs-number')
    }
  }
})

// NHS Number ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/nhs-number', function (req, res) {
  res.render('v1/nhs-number', {
    nhsnumber: req.session.nhsnumber,
    edit: req.session.edit
  });
})

router.post('/v1/nhs-number', function (req, res) {

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
      nhsnumber: req.session.nhsnumber,
      errors: errors
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('/v1/confirm-details')
    } else {
      res.redirect('/v1/current-gp')
    }
  }

})

// Current GP ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/current-gp', function (req, res) {
  res.render('v1/current-gp', {
    currentgp: req.session.currentgp,
    edit: req.session.edit
  });
})

router.post('/v1/current-gp', function (req, res) {

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
      currentgp: req.session.currentgp,
      errors: errors
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('/v1/confirm-details')
    } else {
      res.redirect('/v1/previous-address')
    }
  }

});

// Previous address ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/previous-address', function (req, res) {
  res.render('v1/previous-address', {
    prevaddress: req.session.prevaddress,
    edit: req.session.edit
  });
})

router.post('/v1/previous-address', function (req, res) {

  var passed = true;
  var errors = {};

  req.session.prevaddress = req.body['prev-address'];

  if (!req.body['prev-address']) {
    passed = false;
    error = 'Please answer ‘yes’ or ‘no’';
  }

  if (passed === false) {
    res.render('v1/previous-address', {
      prevaddress: req.session.prevaddress,
      error: error
    });
  } else if (req.body['prev-address'] === 'yes') {
    res.redirect('/v1/previous-address-postcode')
  } else {
    res.redirect('/v1/armed-forces')
  }

});

// Previous address - find +++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/previous-address-postcode', function (req, res) {
  res.render('v1/previous-address-postcode', {
    postcode: req.session.prevpostcode,
    building: req.session.prevbuilding,
    edit: req.session.edit
  });
});

router.post('/v1/previous-address-postcode', function (req, res) {

  req.session.prevpostcode = req.body['postcode'];
  req.session.prevbuilding = req.body['building'];

  if (req.body['postcode'] === '') {
    res.render('v1/previous-address-postcode', {
      building: req.session.prevbuilding,
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
                postcode: req.session.prevpostcode,
                building: req.session.prevbuilding,
                results: req.session.prevAddressResults
              });
            } else {
              req.session.prevAddressResults = filtered;
              res.render('v1/previous-address-result', {
                postcode: req.session.prevpostcode,
                building: req.session.prevbuilding,
                results: req.session.prevAddressResults
              });
            }

          } else {

            req.session.prevAddressResults = addresses;

            res.render('v1/previous-address-result', {
              postcode: req.session.prevpostcode,
              building: req.session.prevbuilding,
              results: req.session.prevAddressResults
            });

          }
        }

      } else {
        res.render('v1/previous-address-postcode', {
          error: {
            general: 'Sorry, there’s been a problem looking up your address. Please try again.'
          },
          postcode: req.session.prevpostcode,
          building: req.session.prevbuilding
        });
      }
    });
  }
})

// Previous address selection ++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/select-previous-address', function (req, res) {
  res.render('v1/select-previous-address', {
    postcode: req.session.prevpostcode,
    results: req.session.prevAddressResults,
    edit: req.session.edit
  });
});

router.post('/v1/select-previous-address', function (req, res) {

  if (!req.body['address']) {
    res.render('v1/previous-address-result', {
      error: 'Please select your home address',
      building: req.session.prevbuilding,
      postcode: req.session.prevpostcode,
      results: req.session.prevAddressResults
    });
  } else {
    req.session.prevAddress = req.body['address'].split(',');
    if (req.session.edit === true) {
      res.redirect('/v1/confirm-details')
    } else {
      res.redirect('/v1/armed-forces')
    }
  }
})

// Leaving the armed forces? +++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/armed-forces', function (req, res) {
  res.render('v1/armed-forces', {
    armedforces: req.session.armedforces,
    edit: req.session.edit
  });
});

router.post('/v1/armed-forces', function (req, res) {

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
      error: error
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('/v1/confirm-details')
    } else {
      res.redirect('/v1/from-abroad')
    }
  }

});

// From abroad? ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/from-abroad', function (req, res) {
  res.render('v1/from-abroad', {
    abroad: req.session.abroad,
    edit: req.session.edit
  });
});

router.post('/v1/from-abroad', function (req, res) {

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
      error: error
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('/v1/confirm-details')
    } else {
      res.redirect('/v1/confirm-details')
    }
  }

});

// Check your answers ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/confirm-details', function (req, res) {
  req.session.edit = true;
  res.render('v1/confirm-details', {
    session: req.session
  });
});

// Registration submitted ++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/v1/registration-submitted', function (req, res) {
  req.session.edit = false;
  res.render('v1/registration-submitted', {
    session: req.session
  });
});

module.exports = router
