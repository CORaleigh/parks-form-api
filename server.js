// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
var morgan = require('morgan');
var passport = require('passport');
var User = require('./app/models/user');
var jwt = require('jwt-simple');

var configDB = require('./config/database.js');
mongoose.connect(configDB.url); // connect to our database
//mongoose.connect('mongodb://localhost:27017/parkForm'); // connect to our database
var FormEntry = require('./app/models/formEntry');
var Facility = require('./app/models/facility');
var Target = require('./app/models/target');
var Job = require('./app/models/job');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan('dev'));
app.use(passport.initialize());


require('./config/passport')(passport); // pass passport for configuration







//var port = process.env.PORT || 8081;        // set our port
var port = 8081;
// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
  // do logging
  console.log('Something is happening.');
  res.header("Access-Control-Allow-Headers",  "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
  next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
  res.json({ message: 'hooray! welcome to our api!' });
});


router.route('/signup')
.post(function (req, res) {
  if (!req.body.email || !req.body.password) {
    res.json({success: false, msg: 'Please pass email and password'});
  } else {
    var newUser = new User({
      email: req.body.email,
      password: req.body.password
    });
    
    newUser.save(function (err) {
      console.log(err);
      if (err)
        return res.json({success: false, msg: 'Username already exists.'})
      res.json({success: true, msg: 'Successfully created new user.'})
    });
  }
});

router.route('/login')
.post(function (req, res) {
  User.findOne({email: req.body.email}, function (err, user){

    if (err)
      throw err
    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      if (user.comparePassword(req.body.password)) {
           var token = jwt.encode(user, configDB.secret);
           res.json({success: true, token: 'JWT ' + token});
      } else {
        res.send({success: false, msg: 'Authentication failed. Wrong password.'});
      }
      // user.comparePassword(req.body.password, function (err, isMatch) {
      //   if (isMatch && !err) {
      //     var token = jwt.encode(user, config.secret);
      //     res.json({success: true, token: 'JWT ' + token});
      //   } else {
      //     res.send({success: false, msg: 'Authentication failed. Wrong password.'});
      //   }
      // }); 
    }
  });
});


router.route('/form')
//get history of form entries
.get(function(req, res) {
    FormEntry.find({}).sort({submitted: -1}).exec(function(err, entries) {
    if (err)
      res.send(err);
    res.json(entries);
  });
})
//add new form entry  
  .post(function (req, res) {
    var entry = new FormEntry();
    entry.programArea = req.body.programArea;
    entry.title = req.body.title;
    entry.category = req.body.category;
    entry.cityFacility = req.body.cityFacility;
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

    entry.save(function (err, newEntry) {
      if (err)
        res.send(err);
      res.json(newEntry);
    })
  })
//delete form entry
.delete(function (req, res) {
	FormEntry.remove({_id: req.body.id}, function (err, entry) {
    if (err)
      res.send(err)
    res.json({message: 'Successfully deleted ' + req.body.id});
  });
});

router.route('/form/:id')
//get form entry by ID
.get(function(req, res) {
  FormEntry.find({_id: req.params.id}).exec(function(err, entries) {
    if (err)
      res.send(err);
    res.json(entries);
  });
})
//update form entry
.post(function (req, res) {
  FormEntry.findById(req.params.id, function(err, entry) {
    if (err)
        res.send(err);
    entry.programArea = req.body.programArea;
    entry.title = req.body.title;
    entry.category = req.body.category;
    entry.cityFacility = req.body.cityFacility;
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
      res.json(entry);
    })
  });
});

router.route('/facilities')
//get list of facilities
.get(function (req, res) {
    Facility.find({}).sort({name: 1}).exec(function(err, facilities) {
    if (err)
      res.send(err);
    res.json(facilities);
  });
})
//add new facility
.post(function (req, res) {
    var facility = new Facility();
    facility.name = req.body.name;
    facility.save(function (err, newFacility) {
    if (err)
      res.send(err);
    res.json(newFacility);
  })
})
//delete facility
.delete(function (req, res){
    Facility.remove({_id: req.body.id}, function (err, entry) {
    if (err)
      res.send(err)
    res.json({message: 'Successfully deleted ' + req.body.id});
  });
});

router.route('/targets')
//get all target areas
.get(function (req, res) {
  Target.find({}).sort({name: 1}).exec(function(err, targets) {
    if (err)
      res.send(err);
    res.json(targets);
  });
})
//add new target area
.post(function (req, res) {
    var target = new Target();
    target.name = req.body.name;
    target._id = mongoose.Types.ObjectId(); 
    target.services = [];
    target.save(function (err, newTarget) {
    if (err)
      res.send(err);
    res.json(newTarget);
  })
})
//delete target area
.delete(function (req, res){
  Target.remove({_id: req.body.id}, function (err, entry) {
    if (err)
      res.send(err)
    res.json({message: 'Successfully deleted ' + req.body.id});
  });
});  


router.route('/jobs')
//get list of jobs
.get(function (req, res) {
  Job.find({}).sort({name: 1}).exec(function(err, jobs) {
    if (err)
      res.send(err);
    res.json(jobs);
  });
})
//add new job
.post(function (req, res) {
    var job = new Job();
    job.name = req.body.name;
    job.save(function (err, newJob) {
    if (err)
      res.send(err);
    res.json(newJob);
  })
})
//delete job
.delete(function (req, res){
  Job.remove({_id: req.body.id}, function (err, entry) {
    if (err)
      res.send(err)
    res.json({message: 'Successfully deleted ' + req.body.id});
  });
});

router.route('/targets/service/:id')
//update service category name and values
.post(function (req, res){
    Target.update({"services._id": req.params.id}, {"$set":{"services.$.value": req.body.value, "services.$.name": req.body.name}}, {}, function (err){
    if (err)
      res.send(err);
    res.json({message: 'Successfully updated'});
  })
})
//delete service category
.delete(function (req, res){
  Target.update({}, {"$pull": { "services": { "_id": req.params.id }}}, {"multi": true}, function (err) {
    if (err) {
      res.send(err);
    }
    res.json({message: 'Successfully removed'});
  });
});

router.route('/targets/:id')
//add new service category
.post(function(req,res){
   Target.update({"_id": mongoose.Types.ObjectId(req.params.id)}, {"$push": { "services" : { "name": req.body.name, "value": req.body.value, "_id": mongoose.Types.ObjectId()}}}, {}, function (err) {
   if (err)
      res.send(err);
   res.json({message: 'Service added'});
  })
});

// all of our routes will be prefixed with /api
app.use('/parks-form-api', router);
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);