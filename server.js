// server.js
// BASE SETUP
// =============================================================================
// call the packages we need
var express = require('express'); // call express
var app = express(); // define our app using express
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');
var User = require('./app/models/user');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var mailer = require("nodemailer");
var async = require('async');
var crypto = require('crypto');
var smtp = require("nodemailer-smtp-transport");
var configDB = require('./config/database.js');
var ObjectID = require('mongodb').ObjectID;

mongoose.connect(configDB.url, {useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex: true}); // connect to our database
mongoose.set('useFindAndModify', false);
var FormEntry = require('./app/models/formEntry');
var Facility = require('./app/models/facility');
//var Target = require('./app/models/target');
var Program = require('./app/models/program');
var Service = require('./app/models/service');
var Job = require('./app/models/job');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(morgan('dev'));
app.use(cors());
app.set('superSecret', configDB.secret);


var smtpTransport = mailer.createTransport(smtp({
    host: "cormailgw2.ci.raleigh.nc.us",
    secureConnection: false,
    port: 25,
    tls: {rejectUnauthorized: false}    
}));
//var port = process.env.PORT || 8081;        // set our port
var port = 8081;
// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); // get an instance of the express Router

// middleware to use for all requests
router.use(function (ignore, res, next) {
    // do logging
    'use strict';
    console.log('Something is happening.');
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/signup')
    .post(function (req, res) {
        'use strict';
        var i;
        if (!req.body.email || !req.body.password) {
            res.json({
                success: false,
                msg: 'Please pass email and password'
            });
        } else {
            var newUser = new User({
                email: req.body.email,
                password: req.body.password,
                admin: false
            });

            newUser.save(function (err, user) {
                console.log(err);
                if (err) {
                    return res.json({
                        success: false,
                        msg: 'Username already exists.'
                    });
                }
                res.json({
                    success: true,
                    msg: 'Successfully created new user.'
                });
                User.find({
                    admin: true
                }, function (ignore, users) {
                    console.log(users);
                    var toList = [];
                    for (i = 0; i < users.length; i += 1) {
                        toList.push(users[i].email);
                    }
                    var mail = {
                        from: "gis@raleighnc.gov",
                        to: toList,
                        subject: "New Parks Pricing Form Signup",
                        text: "New user " + user.email + " signed up."
                    };

                    smtpTransport.sendMail(mail, function (error, response) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log("Message sent: " + response.message);
                        }

                        smtpTransport.close();
                    });
                });

            });
        }
    });

router.route('/login')
    .post(function (req, res) {
        'use strict';
        User.findOne({
            email: req.body.email
        }, function (err, user) {
            if (err) {
                throw err;
            }
            if (!user) {
                res.send({
                    success: false,
                    msg: 'Authentication failed. User not found.'
                });
            } else {
                if (user.comparePassword(req.body.password)) {
                    var token = jwt.sign(user.toJSON(), app.get('superSecret'), {
                        expiresIn: '1440m'
                    });
                    var expires = new Date();
                    expires.setDate(expires.getDate() + 1);
                    res.json({
                        success: true,
                        token: token,
                        expires: expires,
                        user: {
                            email: user.email,
                            admin: user.admin
                        }
                    });
                } else {
                    res.send({
                        success: false,
                        msg: 'Authentication failed. Wrong password.'
                    });
                }
            }
        });
    });

router.route('/forgot')
    .post(function (req, res) {
        'use strict';
        async.waterfall([
            function (done) {
                crypto.randomBytes(20, function (err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function (token, done) {
                User.findOne({
                    email: req.body.email
                }, function (err, user) {
                    if (err) {
                        throw err;
                    }
                    if (!user) {
                        res.send({
                            success: false,
                            msg: 'User not found.'
                        });
                    } else {
                        user.resetPasswordToken = token;
                        user.resetPasswordExpires = Date.now() + 3600000;
                        user.save(function (err) {
                            done(err, token, user);
                        });
                    }

                });
            },
            function (token, user, ignore) {
                var mailOptions = {
                    to: user.email,
                    from: 'gis@raleighnc.gov',
                    subject: 'Parks Pricing Form Password Reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                            req.headers.referer + '#/reset/' + token + '\n\n' +
                            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                smtpTransport.sendMail(mailOptions, function (err) {
                    if (err) {
                        res.send({
                            success: false,
                            message: err.response
                        });
                    }
                    res.json({
                        success: true,
                        message: 'Sent reset email.'
                    });
                });
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            //res.redirect('/forgot');
        });
    });
router.route('/reset')
    //update user admin
    .post(function (req, res) {
        'use strict';
        async.waterfall([
            function (done) {
                User.findOne({
                    resetPasswordToken: req.body.token,
                    resetPasswordExpires: {
                        $gt: Date.now()
                    }
                }, function (ignore, user) {
                    if (!user) {
                        //req.flash('error', 'Password reset token is invalid or has expired.');
                        res.send({
                            success: false,
                            message: 'Password reset token is invalid or has expired'
                        });
                        //return res.redirect('back');
                    }

                    user.password = req.body.password;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
                    user.save(function (err) {
                        // req.logIn(user, function (err) {
                        //   done(err, user);
                        // });
                        done(err, user);
                    });
                });
            },
            function (user, done) {
                var mailOptions = {
                    to: user.email,
                    from: 'gis@raleighnc.gov',
                    subject: 'Parks Pricing Form Password Has Been Changed',
                    text: 'Hello,\n\n' +
                            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                smtpTransport.sendMail(mailOptions, function (err) {
                    if (err) {
                        res.send({
                            success: false,
                            message: err.response
                        });
                    }
                    res.json({
                        success: true,
                        user: user
                    });
                    done(err);
                });
            }
        ]);
    });
var admin = false;
// middleware to use for all requests
router.use(function (req, res, next) {
    // do logging
    'use strict';
    console.log('Something is happening.');
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");

    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
            if (decoded) {
                admin = decoded.admin;
            }
            if (err) {
                return res.json({
                    success: false,
                    message: 'Session has expired, please log back in.'
                });
            }
            req.decoded = decoded;
            next();
        });
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }

    // next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (ignore, res) {
    'use strict';
    res.json({
        message: 'hooray! welcome to our api!'
    });
});

router.route('/form')
    //get history of form entries
    .get(function (req, res) {
        'use strict';
        var where = {};
        if (req.query.where) {
            where = JSON.parse(req.query.where);
        }
        if (where.start) {
            if (where.start.$gte) {
                where.start.$gte = new Date(where.start.$gte);
            }
            if (where.start.$lte) {
                where.start.$lte = new Date(where.start.$lte);
            }
        }
        console.log(where);
        FormEntry.find(where).sort({
            submitted: -1
        }).exec(function (err, entries) {
            if (err) {
                res.send(err);
            }
            res.json({
                success: true,
                results: entries
            });
        });
    })
    //add new form entry
    .post(function (req, res) {
        'use strict';
        var entry = new FormEntry();
        var i;
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
        entry.supplyType = req.body.supplyType;
        entry.submitted = req.body.submitted;
        entry.needsReview = req.body.needsReview;
        entry.revenue = req.body.revenue;
        entry.cost = req.body.cost;
        entry.recoveryProjected = req.body.recoveryProjected;
        entry.recoveryTarget = req.body.recoveryTarget;
        entry.dropins = req.body.dropins;
        entry.personnel = [];


        if (req.body.personnel) {
            var personnel = JSON.parse(req.body.personnel);
            for (i = 0; i < personnel.length; i += 1) {
                entry.personnel.push({
                    title: personnel[i].title,
                    payType: personnel[i].payType,
                    rate: personnel[i].rate,
                    status: personnel[i].status,
                    count: personnel[i].count,
                    hourType: (personnel[i].hourType) ? personnel[i].hourType : "",
                    hours: (personnel[i].hours) ? personnel[i].hours : 0,
                });
            }
        }

        entry.save(function (err, newEntry) {
            if (err) {
                res.send(err);
            }
            res.json({
                success: true,
                results: newEntry
            });
        });
    })
    //delete form entry
    .delete(function (req, res) {
        // if (admin) {
        'use strict';
        FormEntry.deleteOne({
            _id: req.body.id
        }, function (err) {
            if (err) {
                res.send(err);
            }
            res.json({
                success: true,
                message: 'Successfully deleted ' + req.body.id
            });
        });
        //} else {
        //   res.json({success: false, message: 'You do not have permission to do this'});
        //}
    });

router.route('/form/:id')
    //get form entry by ID
    .get(function (req, res) {
        'use strict';
        FormEntry.find({
            _id: req.params.id
        }).exec(function (err, entries) {
            if (err) {
                res.send(err);
            }
            res.json({
                success: true,
                results: entries
            });
        });
    })
    //update form entry
    .post(function (req, res) {
        'use strict';
        var i;
        FormEntry.findById(req.params.id, function (err, entry) {
            if (err) {
                res.send(err);
            }
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
            entry.supplyType = req.body.supplyType;
            entry.submitted = req.body.submitted;
            entry.needsReview = req.body.needsReview;
            entry.revenue = req.body.revenue;
            entry.cost = req.body.cost;
            entry.recoveryProjected = req.body.recoveryProjected;
            entry.recoveryTarget = req.body.recoveryTarget;
            entry.adminFee = req.body.adminFee;
            entry.personnel = [];
            if (req.body.personnel) {
                var personnel = JSON.parse(req.body.personnel);
                for (i = 0; i < personnel.length; i += 1) {
                    entry.personnel.push({
                        title: personnel[i].title,
                        payType: personnel[i].payType,
                        rate: personnel[i].rate,
                        status: personnel[i].status,
                        count: personnel[i].count,
                        hourType: (personnel[i].hourType) ? personnel[i].hourType : "",
                        hours: (personnel[i].hours) ? personnel[i].hours : 0,
                    });
                }
            }
            entry.save(function (err) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    results: entry
                });
            });
        });
    });

router.route('/facilities')
    //get list of facilities
    .get(function (ignore, res) {
        'use strict';
        Facility.find({}).sort({
            name: 1
        }).exec(function (err, facilities) {
            if (err) {
                res.send(err);
            }

            res.json({
                success: true,
                results: facilities
            });
        });
    })
    //add new facility
    .post(function (req, res) {
        'use strict';
        if (admin) {
            var facility = new Facility();
            facility.name = req.body.name;
            facility.save(function (err, newFacility) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    results: newFacility
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    })
    //delete facility
    .delete(function (req, res) {
        'use strict';
        if (admin) {
            Facility.deleteOne({
                _id: req.body.id
            }, function (err) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    message: 'Successfully deleted ' + req.body.id
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    });

router.route('/programs')
    //get all target areas
    .get(function (ignore, res) {
        'use strict';
        Program.find({}).sort({
            name: 1
        }).exec(function (err, programs) {
            if (err) {
                res.send(err);
            }
            res.json({
                success: true,
                results: programs
            });
        });
    })
    //add new target area
    .post(function (req, res) {
        'use strict';
        if (admin) {
            var program = new Program();
            program.name = req.body.name;
            program._id = mongoose.Types.ObjectId();
            program.save(function (err, newProgram) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    results: newProgram
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    })
    //delete target area
    .delete(function (req, res) {
        'use strict';
        if (admin) {
            Program.deleteOne({
                _id: req.body.id
            }, function (err) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    message: 'Successfully deleted ' + req.body.id
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    });


// router.route('/targets')
// //get all target areas
// .get(function (req, res) {
//   Target.find({}).sort({name: 1}).exec(function (err, targets) {
//     if (err)
//       res.send(err);
//       res.json({success: true, results: targets});
//   });
// })
// //add new target area
// .post(function (req, res) {
//   if (admin) {
//     var target = new Target();
//     target.name = req.body.name;
//     target._id = mongoose.Types.ObjectId();
//     target.services = [];
//     target.save(function (err, newTarget) {
//       if (err)
//         res.send(err);
//       res.json({success: true, results: newTarget});
//     });
//   } else {
//     res.json({success: false, message: 'You do not have permission to do this'});
//   }
// })
// //delete target area
// .delete(function (req, res){
//   if (admin) {
//     Target.deleteOne({_id: req.body.id}, function (err, entry) {
//       if (err)
//         res.send(err)
//       res.json({success: true, message: 'Successfully deleted ' + req.body.id});
//     });
//   } else {
//     res.json({success: false, message: 'You do not have permission to do this'});
//   }
// });


router.route('/services')
    //get all target areas
    .get(function (ignore, res) {
        'use strict';
        Service.find({}).sort({
            name: 1
        }).exec(function (err, services) {
            if (err) {
                res.send(err);
            }
            res.json({
                success: true,
                results: services
            });
        });
    })
    //add new target area
    .post(function (req, res) {
        'use strict';
        if (admin) {
            var service = new Service();
            service.name = req.body.name;
            service.value = req.body.value;
            service._id = mongoose.Types.ObjectId();
            service.save(function (err, newService) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    results: newService
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    })
    //delete target area
    .delete(function (req, res) {
        'use strict';
        if (admin) {
            Service.deleteOne({
                _id: req.body.id
            }, function (err) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    message: 'Successfully deleted ' + req.body.id
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    });


router.route('/jobs')
    //get list of jobs
    .get(function (ignore, res) {
        'use strict';
        Job.find({}).sort({
            name: 1
        }).exec(function (err, jobs) {
            if (err) {
                res.send(err);
            }
            res.json({
                success: true,
                results: jobs
            });
        });
    })
    //add new job
    .post(function (req, res) {
        'use strict';
        if (admin) {
            var job = new Job();
            job.name = req.body.name;
            job.save(function (err, newJob) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    results: newJob
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    })
    //delete job
    .delete(function (req, res) {
        'use strict';
        if (admin) {
            Job.deleteOne({
                _id: req.body.id
            }, function (err) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    message: 'Successfully deleted ' + req.body.id
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    });

router.route('/services/:id')
    //update service category name and values
    .post(function (req, res) {
        'use strict';
        if (admin) {
            Service.updateOne({
                _id: req.params.id
            }, {
                $set: {
                    value: req.body.value,
                    name: req.body.name
                }
            }, function (err) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    message: 'Successfully updated'
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    });
// //delete service category
// .delete(function (req, res){
//   if (admin) {
//     Service.updateOne({}, {"$pull": { "services": { "_id": req.params.id }}}, {"multi": true}, function (err) {
//       if (err) {
//         res.send(err);
//       }
//       res.json({success: true, message: 'Successfully removed'});
//     });
//   } else {
//     res.json({success: false, message: 'You do not have permission to do this'});
//   }
// });

// router.route('/targets/:id')
// //add new service category
// .post(function (req,res){
//   if (admin) {
//    Target.updateOne({"_id": mongoose.Types.ObjectId(req.params.id)}, {"$push": { "services" : { "name": req.body.name, "value": req.body.value, "_id": mongoose.Types.ObjectId()}}}, {}, function (err) {
//      if (err)
//         res.send(err);
//      res.json({success: true, message: 'Service added'});
//     });
//   } else {
//     res.json({success: false, message: 'You do not have permission to do this'});
//   }
// });

router.route('/users')
    //get list of users
    .get(function (ignore, res) {
        'use strict';
        if (admin) {
            User.find({}).sort({
                name: 1
            }).exec(function (err, users) {
                if (err) {
                    res.send(err);
                }
                var data = [],
                    i = 0;
                for (i = 0; i < users.length; i += 1) {
                    delete users[i].password;
                    data.push({
                        _id: users[i]._id,
                        email: users[i].email,
                        admin: users[i].admin
                    });
                }
                res.json({
                    success: true,
                    results: data
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    });
router.route('/users/:id')
    //update user admin
    .post(function (req, res) {
        'use strict';
        if (admin) {

            console.log(req.body.admin);
            User.findOneAndUpdate({
                _id: req.params.id
            }, {
                    admin:  req.body.admin
                }
            , function (err) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    message: 'Successfully updated'
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    })
    //delete user by id
    .delete(function (req, res) {
        'use strict';
        if (admin) {
            User.deleteOne({
                _id: req.params.id
            }, function (err) {
                if (err) {
                    res.send(err);
                }
                res.json({
                    success: true,
                    message: 'Successfully deleted ' + req.body.id
                });
            });
        } else {
            res.json({
                success: false,
                message: 'You do not have permission to do this'
            });
        }
    });
// all of our routes will be prefixed with /api
app.use('/parks-form-api', router);
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
