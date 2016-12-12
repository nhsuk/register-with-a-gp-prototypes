var express = require('express')
var router = express.Router()

router.get('/user-email', function (req, res) {
  req.session.destroy();
  res.render('user_email/_email-user-receipt.html');
});

module.exports = router
