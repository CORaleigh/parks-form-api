// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
//mongoose.connect('mongodb://imaps:ralwake2009@mongdbprdapplv1:27017/imaps'); // connect to our database
mongoose.connect('mongodb://localhost:27017/parkForm'); // connect to our database
var FormEntry = require('./app/models/formEntry');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers",  "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});




router.route('/form')
  .get(function(req, res) {
    FormEntry.find({}).sort({submitted: -1}).exec(function(err, entries) {
        if (err)
            res.send(err);
        res.json(entries);
    });
  })
  .post(function (req, res) {
    var entry = new FormEntry();
    entry.programArea = req.body.programArea;
    entry.title = req.body.title;
    entry.category = req.body.category;
    entry.facility = req.body.facility;
    entry.start = req.body.start;
    entry.preparer = req.body.preparer;
    entry.comments = req.body.comments;
    entry.newProgram = req.body.newProgram;
    entry.minParticipants = req.body.minParticipants;
    entry.maxParticipants = req.body.maxParticipants;
    entry.full = req.body.full;
    entry.weeks = req.body.weeks;
    entry.hours = req.body.hours;
    entry.residentialRate = req.body.residentialRate;
    entry.nonResidentialRate = req.body.nonResidentialRate;
    entry.altRevDesc = req.body.altRevDesc;
    entry.altRevAmt = req.body.altRevAmt;
    entry.supplyDesc = req.body.supplyDesc;
    entry.supplyAmt = req.body.supplyAmt;
    entry.submitted = req.body.submitted;
    entry.needsReview = req.body.needsReview;
    entry.revenue = req.body.revenue;
    entry.cost = req.body.cost;
    entry.recoveryProjected = req.body.recoveryProjected;
    entry.recoveryTarget = req.body.recoveryTarget;
    entry.personnel = [];
    
    if (req.body.personnel) {
      var personnel = JSON.parse(req.body.personnel);
      for (var i = 0; i < personnel.length; i++) {
        entry.personnel.push({title: personnel[i].title,
        payType: personnel[i].payType,
        rate: personnel[i].rate,
        status: personnel[i].status,   
        count: personnel[i].count});
      }
    }

    entry.save(function (err) {
      if (err)
        res.send(err);
      res.json({message: entry});
    })
  })
router.route('/form/:id')
  .post(function (req, res) {

  FormEntry.findById(req.params.id, function(err, entry) {

      if (err)
          res.send(err);

    entry.programArea = req.body.programArea;
    entry.title = req.body.title;
    entry.category = req.body.category;
    entry.facility = req.body.facility;
    entry.start = req.body.start;
    entry.preparer = req.body.preparer;
    entry.comments = req.body.comments;
    entry.newProgram = req.body.newProgram;
    entry.minParticipants = req.body.minParticipants;
    entry.maxParticipants = req.body.maxParticipants;
    entry.full = req.body.full;
    entry.weeks = req.body.weeks;
    entry.hours = req.body.hours;
    entry.residentialRate = req.body.residentialRate;
    entry.nonResidentialRate = req.body.nonResidentialRate;
    entry.altRevDesc = req.body.altRevDesc;
    entry.altRevAmt = req.body.altRevAmt;
    entry.supplyDesc = req.body.supplyDesc;
    entry.supplyAmt = req.body.supplyAmt;
    entry.submitted = req.body.submitted;
    entry.needsReview = req.body.needsReview;
    entry.revenue = req.body.revenue;
    entry.cost = req.body.cost;
    entry.recoveryProjected = req.body.recoveryProjected;
    entry.recoveryTarget = req.body.recoveryTarget;
    entry.personnel = [];
    
    if (req.body.personnel) {
      var personnel = JSON.parse(req.body.personnel);
      for (var i = 0; i < personnel.length; i++) {
        entry.personnel.push({title: personnel[i].title,
        payType: personnel[i].payType,
        rate: personnel[i].rate,
        status: personnel[i].status,   
        count: personnel[i].count});
      }
    }

    entry.save(function (err) {
      if (err)
        res.send(err);
      res.json({message: entry});
    })
  });




  })
// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
