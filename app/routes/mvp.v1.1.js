var express = require('express')
var router = express.Router()
var nunjucks = require('nunjucks')

var request = require('request')
var naturalSort = require('javascript-natural-sort')
var postcode_api = process.env.POSTCODE_API

// MVP v1.1 prototype
// See https://github.com/nhsuk/register-with-a-gp-design/blob/master/Register%20interaction%20flow/register-flow-v2.pdf

// Start page +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/start', function (req, res) {
  req.session.destroy();
  res.render('mvp_v1_1/start', {
    suppressServiceName: true
  });
});

// Name ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/name', function (req, res) {
  res.render('mvp_v1_1/name')
});

router.post('/name', function (req, res) {

  var passed = true;

  if (!req.session.name) {
    req.session.name = {};
  }

  if (req.body['first-name'] === '' || req.body['last-name'] === '') {
    var error = 'Please enter your full name';
    passed = false;
  } else {
    req.session.name.firstName = req.body['first-name']
    req.session.name.middleNames = req.body['middle-names']
    req.session.name.lastName = req.body['last-name']
  }

  if (passed === false) {
    res.render('mvp_v1_1/name', { error });
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
  res.render('mvp_v1_1/date-of-birth');
});

router.post('/date-of-birth', function (req, res) {

  req.session.dob = {
    'day': req.body['dob-day'],
    'month': req.body['dob-month'],
    'year': req.body['dob-year']
  };

  if (req.body['dob-day'] === '' || req.body['dob-month'] === '' || req.body['dob-year'] === '') {
    res.render('mvp_v1_1/date-of-birth', { error: 'Please enter your date of birth' });
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
  res.render('mvp_v1_1/nhs-number');
})

router.post('/nhs-number', function (req, res) {

  var passed = true;

  if (!req.session.nhsnumber) {
    req.session.nhsnumber = {};
  }

  if (!req.body['nhs-number-known']) {
    error = 'Please answer ‘yes’ or ‘no’';
    passed = false;
  } else {
    req.session.nhsnumber.known = req.body['nhs-number-known'];
  }

  if (passed === false) {
    res.render('mvp_v1_1/nhs-number', { error });
  } else {
    if (req.body['nhs-number-known'] === 'yes') {
      res.redirect('nhs-number-details')
    } else {
      if (req.session.edit === true) {
        res.redirect('confirm-details')
      } else {
        res.redirect('contact-email')
      }
    }
  }

})

// NHS Number details ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/nhs-number-details', function (req, res) {
  res.render('mvp_v1_1/nhs-number-details' );
})

router.post('/nhs-number-details', function (req, res) {

  var passed = true;

  if (!req.session.nhsnumber) {
    req.session.nhsnumber = {};
  }

  if (req.body['nhs-number'] === '') {
    passed = false;
    error = 'Please enter your NHS number';
  } else {
    req.session.nhsnumber.number = req.body['nhs-number'];
  }

  if (passed === false) {
    res.render('mvp_v1_1/nhs-number-details', { error });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('contact-email')
    }
  }

});

// Contact email +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/contact-email', function (req, res) {
  res.render('mvp_v1_1/contact-email');
});

router.post('/contact-email', function (req, res) {

  if (!req.session.contact) {
    req.session.contact = {}
  }

  req.session.contact.email = req.body['email']

  if (req.body['email'] === '') {
    res.render('mvp_v1_1/contact-email', {
      error: 'Please provide an email address'
    });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('contact-telephone')
    }
  }
})

// Contact phone +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/contact-telephone', function (req, res) {
  res.render('mvp_v1_1/contact-telephone');
});

router.post('/contact-telephone', function (req, res) {

  if (!req.session.contact) {
    req.session.contact = {}
  }

  req.session.contact.telephone = req.body['telephone']
  req.session.contact.mobile = req.body['mobile']

  if (req.session.edit === true) {
    res.redirect('confirm-details')
  } else {
    res.redirect('home-address')
  }
})

// Postcode ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/home-address', function (req, res) {
  res.render('mvp_v1_1/home-address-postcode');
});

router.post('/home-address', function (req, res) {

  if (!req.session.homeAddress) {
    req.session.homeAddress = {}
  }

  req.session.homeAddress.postcode = req.body['postcode'];
  req.session.homeAddress.building = req.body['building'];

  if (req.body['postcode'] === '') {
    res.render('mvp_v1_1/home-address-postcode', {
      error: {
        postcode: 'Please enter your home postcode'
      }
    });
  } else {
    // strip spaces
    var cleaned = req.session.homeAddress.postcode.replace(/\s+/g, '').toLowerCase();

    request('https://api.getAddress.io/v2/uk/' + cleaned + '/?api-key=' + postcode_api + '&format=true', function (error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          var parsed = JSON.parse(body);
          var addresses = parsed['Addresses'];
          addresses.sort(naturalSort);
          var filtered = [];

          if (req.session.homeAddress.building !== '') {
            for (var i=0; i<addresses.length; i++) {
              //var current = addresses[i][0];
              var current = addresses[i].toString().toLowerCase();
              if (current.indexOf(req.session.homeAddress.building.toLowerCase()) !== -1) {
                filtered.push(addresses[i]);
              }
            }

            if (filtered.length === 0) {
              // Nothing found for this combo of building / postcode
              // So just display the postcode results?
              req.session.addressResults = addresses;
              res.render('mvp_v1_1/home-address-result', {
                message: 'No exact match has been found, showing all addresses for ' + req.session.homeAddress.postcode,
              });
            } else {
              req.session.addressResults = filtered;
              res.render('mvp_v1_1/home-address-result');
            }

          } else {

            req.session.addressResults = addresses;

            res.render('mvp_v1_1/home-address-result');

          }
        }

      } else {
        res.render('mvp_v1_1/home-address-postcode', {
          error: {
            general: 'Sorry, there’s been a problem looking up your address. Please try again.'
          }
        });
      }
    });
  }
})

// Address selection +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/select-address', function (req, res) {
  res.render('mvp_v1_1/select-address');
});

router.post('/select-address', function (req, res) {

  if (!req.body['address']) {
    res.render('mvp_v1_1/home-address-result', {
      error: 'Please select your home address'
    });
  } else {
    req.session.homeAddress.address = req.body['address'].split(',');
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('current-gp')
    }
  }
})

// Manual address entry ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/home-address-manual', function (req, res) {
  res.render('mvp_v1_1/home-address-manual');
});

router.post('/home-address-manual', function (req, res) {

  if (!req.session.homeAddress) {
    req.session.homeAddress = {}
  }

  req.session.homeAddress.address = [
    req.body['address-1'],
    req.body['address-2'],
    req.body['address-3'],
    req.body['address-4']
  ];
  req.session.homeAddress.postcode = req.body['postcode'];

  if (!req.body['address-1'] && !req.body['address-4']) {
    res.render('mvp_v1_1/home-address-manual', {
      error: 'Please enter your full address'
    });
  } else if (req.session.edit === true) {
    res.redirect('confirm-details')
  } else {
    res.redirect('current-gp')
  }

})

// Current GP ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/current-gp', function (req, res) {
  res.render('mvp_v1_1/current-gp');
})

router.post('/current-gp', function (req, res) {

  var passed = true;

  if (!req.session.currentgp) {
    req.session.currentgp = {}
  }

  if (!req.body['current-gp']) {
    passed = false;
    error = 'Please answer ‘yes’ or ‘no’';
  } else {
    req.session.currentgp.registered = req.body['current-gp']
  }

  if (passed === false) {
    res.render('mvp_v1_1/current-gp', { error });
  } else if (req.body['current-gp'] === 'yes') {
    res.redirect('current-gp-lookup')
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('armed-forces')
    }
  }

});

// Lookup GP +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/current-gp-lookup', function (req, res) {
  res.render('mvp_v1_1/gp-lookup');
});

router.post('/current-gp-lookup', function (req, res) {

  if (!req.session.currentgp) {
    req.session.currentgp = {}
  }

  req.session.currentgp.name = req.body['practice-name'];
  req.session.currentgp.address = req.body['practice-address'].split(',');
  if (req.session.edit === true) {
    res.redirect('confirm-details')
  } else {
    res.redirect('previous-name')
  }
});


// Previous name +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

router.get('/previous-name', function(req, res) {
  res.render('mvp_v1_1/previous-name');
});

router.post('/previous-name', function(req, res) {

  var passed = true;

  if (!req.session.name) {
    req.session.name = {};
  }

  if (!req.body['name-changed']) {
    error = 'Please answer this question';
    passed = false;
  } else {
    req.session.name.nameChanged = req.body['name-changed'];
  }

  if (passed === false) {
    res.render('mvp_v1_1/previous-name', { error });
  } else {
    if (req.body['name-changed'] === 'yes') {
      res.redirect('previous-name-details')
    } else {
      if (req.session.edit === true) {
        res.redirect('confirm-details')
      } else {
        res.redirect('previous-address')
      }
    }
  }
});

// Previous name details +++++++++++++++++++++++++++++++++++++++++++++++++++++++

router.get('/previous-name-details', function(req, res) {
  res.render('mvp_v1_1/previous-name-details');
});

router.post('/previous-name-details', function(req, res) {

  var passed = true;

  if (!req.session.name) {
    req.session.name = {};
  }

  if (!req.body['previous-first-name'] && !req.body['previous-last-name']) {
    error = 'Please enter your full previous name';
    passed = false;
  } else {
    req.session.name.previousFirstName = req.body['previous-first-name'];
    req.session.name.previousMiddleNames = req.body['previous-middle-names'];
    req.session.name.previousLastName = req.body['previous-last-name'];
  }

  if (passed === false) {
    res.render('mvp_v1_1/previous-name-details', { error });
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
  res.render('mvp_v1_1/previous-address');
})

router.post('/previous-address', function (req, res) {

  var passed = true;

  if (!req.session.prevaddress) {
    req.session.prevaddress = {}
  }

  if (!req.body['prev-address']) {
    passed = false;
    var error = 'Please answer ‘yes’ or ‘no’';
  } else {
    req.session.prevaddress = req.body['prev-address'];
  }

  if (passed === false) {
    res.render('mvp_v1_1/previous-address', { error });
  } else if (req.body['prev-address'] === 'yes') {
    res.redirect('previous-address-postcode')
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('current-medication')
    }
  }

});

// Previous address - find +++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/previous-address-postcode', function (req, res) {
  res.render('mvp_v1_1/previous-address-postcode');
});

router.post('/previous-address-postcode', function (req, res) {

  req.session.prevpostcode = req.body['postcode'];
  req.session.prevbuilding = req.body['building'];

  if (req.body['postcode'] === '') {
    res.render('mvp_v1_1/previous-address-postcode', {
      error: {
        postcode: 'Please enter your previous postcode'
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
              res.render('mvp_v1_1/previous-address-result', {
                message: 'No exact match has been found, showing all addresses for ' + req.session.prevpostcode,
                session: req.session
              });
            } else {
              req.session.prevAddressResults = filtered;
              res.render('mvp_v1_1/previous-address-result');
            }

          } else {

            req.session.prevAddressResults = addresses;

            res.render('mvp_v1_1/previous-address-result');

          }
        }

      } else {
        res.render('mvp_v1_1/previous-address-postcode', {
          error: {
            general: 'Sorry, there’s been a problem looking up your address. Please try again.'
          }
        });
      }
    });
  }
})

// Previous address selection ++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/select-previous-address', function (req, res) {
  res.render('mvp_v1_1/select-previous-address');
});

router.post('/select-previous-address', function (req, res) {

  if (!req.body['address']) {
    res.render('mvp_v1_1/previous-address-result', {
      error: 'Please select your previous address'
    });
  } else {
    req.session.prevAddress = req.body['address'].split(',');
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('current-medication')
    }
  }
})

// Manual address entry ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/previous-address-manual', function (req, res) {
  res.render('mvp_v1_1/previous-address-manual');
});

router.post('/previous-address-manual', function (req, res) {

  req.session.prevAddress = [
    req.body['address-1'],
    req.body['address-2'],
    req.body['address-3'],
    req.body['address-4']
  ];
  req.session.prevpostcode = req.body['postcode'];

  if (!req.body['address-1'] && !req.body['address-4']) {
    res.render('mvp_v1_1/home-address-manual', {
      error: 'Please enter your full address'
    });
  } else if (req.session.edit === true) {
    res.redirect('confirm-details')
  } else {
    res.redirect('current-medication')
  }

})

// Minimumn health questionnaire: current meds? ++++++++++++++++++++++++++++++++
router.get('/current-medication', function (req, res) {
  res.render('mvp_v1_1/current-medication');
});

router.post('/current-medication', function (req, res) {

  var passed = true;

  if (!req.session.health) {
    req.session.health = {}
  }

  if (!req.body['medication']) {
    passed = false;
    var error = 'Please answer ‘yes’ or ‘no’';
  } else {
    req.session.health.medication = req.body['medication']
  }

  if (passed === false) {
    res.render('mvp_v1_1/current-medication', { error });
  } else if (req.body['medication'] === 'yes') {
    res.redirect('current-medication-details')
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('any-allergies')
    }
  }

});

// Minimumn health questionnaire: current med details ++++++++++++++++++++++++++
router.get('/current-medication-details', function (req, res) {
  res.render('mvp_v1_1/current-medication-details');
});

router.post('/current-medication-details', function (req, res) {

  var passed = true;

  if (!req.session.health) {
    req.session.health = {}
  }

  if (req.body['medication-details'] === '') {
    passed = false;
    var error = 'Please enter your medication details';
  } else {
    req.session.health.medicationDetails = req.body['medication-details']
  }

  if (passed === false) {
    res.render('mvp_v1_1/current-medication-details', { error });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('any-allergies')
    }
  }
});

// Minimumn health questionnaire: allergies ++++++++++++++++++++++++++++++++++++
router.get('/any-allergies', function (req, res) {
  res.render('mvp_v1_1/any-allergies');
});

router.post('/any-allergies', function (req, res) {

  var passed = true;

  if (!req.session.health) {
    req.session.health = {}
  }

  if (!req.body['allergies']) {
    passed = false;
    var error = 'Please answer ‘yes’ or ‘no’';
  } else {
    req.session.health.allergies = req.body['allergies']
  }

  if (passed === false) {
    res.render('mvp_v1_1/any-allergies', { error });
  } else if (req.body['allergies'] === 'yes') {
    res.redirect('allergies-details')
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('medical-history')
    }
  }

});

// Minimumn health questionnaire: allergies details ++++++++++++++++++++++++++++
router.get('/allergies-details', function (req, res) {
  res.render('mvp_v1_1/allergies-details');
});

router.post('/allergies-details', function (req, res) {

  var passed = true;

  if (!req.session.health) {
    req.session.health = {}
  }

  if (req.body['allergies-details'] === '') {
    passed = false;
    var error = 'Please enter your allergy details';
  } else {
    req.session.health.allergiesDetails = req.body['allergies-details']
  }

  if (passed === false) {
    res.render('mvp_v1_1/allergies-details', { error });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      res.redirect('medical-history')
    }
  }
});

// Minimumn health questionnaire: medical histoy +++++++++++++++++++++++++++++++
router.get('/medical-history', function (req, res) {
  res.render('mvp_v1_1/history');
});

router.post('/medical-history', function (req, res) {

  if (!req.session.health) {
    req.session.health = {}
  }

  var history = req.body['medical-history'];

  if (history === '') {
    history = 'no'
  }

  req.session.health.medicalHistory = history

  res.redirect('confirm-details')

});

//==============================================================================

// Armed forces branch

//==============================================================================

// Leaving the armed forces? +++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/armed-forces', function (req, res) {
  res.render('mvp_v1_1/armed-forces');
});

router.post('/armed-forces', function (req, res) {

  var passed = true;

  if (!req.session.armedforces) {
    req.session.armedforces = {}
  }

  if (!req.body['armed-forces']) {
    passed = false;
    error = 'Please answer ‘yes’ or ‘no’';
  } else {
    req.session.armedforces.leaving = req.body['armed-forces']
  }

  if (passed === false) {
    res.render('mvp_v1_1/armed-forces', { error });
  } else {
    if (req.session.edit === true) {
      res.redirect('confirm-details')
    } else {
      if (req.body['armed-forces'] === 'yes') {
        res.redirect('armed-forces-service-number')
      } else {
        res.redirect('current-medication')
      }
    }
  }

});

// Armed forces service number +++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/armed-forces-service-number', function (req, res) {
  res.render('mvp_v1_1/armed-forces-service-number');
});

router.post('/armed-forces-service-number', function (req, res) {

  if (!req.session.armedforces) {
    req.session.armedforces = {}
  }
  req.session.armedforces.serviceno = req.body['service-no']

  if (req.session.edit === true) {
    res.redirect('confirm-details')
  } else {
    res.redirect('armed-forces-enlistment-date')
  }

});

// Armed forces enlistment date ++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/armed-forces-enlistment-date', function (req, res) {
  res.render('mvp_v1_1/armed-forces-enlistment-date');
});

router.post('/armed-forces-enlistment-date', function (req, res) {

  if (!req.session.armedforces) {
    req.session.armedforces = {}
  }
  req.session.armedforces.enlistment = {
    day: req.body['enlistment-day'],
    month: req.body['enlistment-month'],
    year: req.body['enlistment-year']
  }

  if (req.session.edit === true) {
    res.redirect('confirm-details')
  } else {
    res.redirect('current-medication')
  }

});

//==============================================================================

// END Armed forces branch

//==============================================================================

// Check your answers ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/confirm-details', function (req, res) {
  req.session.edit = true;
  res.render('mvp_v1_1/confirm-details');
});

// Registration submitted ++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/registration-submitted', function (req, res) {
  req.session.edit = false;
  res.render('mvp_v1_1/registration-submitted');
});



// EMAIL to GP +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/gp-email', function (req, res) {
  req.session.edit = false;
  res.render('mvp_v1_1/_email-gp-notification');
});

module.exports = router
