var express = require('express'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    app = express(),
    path = require('path'),
    session = require('express-session'),
    User = require('./models/user');

    mongoose.connect('mongodb://localhost:27017/login-system');
    mongoose.connection.on('connected', function(){
      console.log('Connected to database');
    });
    mongoose.connection.on('error', function(err){
      console.log('Error connectiong to database: ' + err);
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(morgan('dev'));
    app.use(express.static(path.join(__dirname, 'public')));

    function requiresLogin(req, res, next){
      if(req.session && req.session.userId){
        return next();
      } else {
        var err = new Error('You must be logged in to view this page');
        err.status = 401;
        return next(err);
      }
    }

    //use session for tracking logins
    app.use(session({
      secret: 'secret',
      resave: true,
      saveUninitialized: false
    }))

    app.get('/', function(req, res){
      res.sendFile(__dirname + 'public/index.html');
    });

    //signup route
    app.post('/api/signup', function(req, res, next){

      if (req.body.password !== req.body.passwordConf) {
        var err = new Error('Passwords do not match.');
        err.status = 400;
        res.send("passwords dont match");
        return next(err);
      }

      if(req.body.email && req.body.username && req.body.password && req.body.passwordConf){
        var userData = {
          email: req.body.email,
          username: req.body.username,
          password: req.body.password,
          passwordConf: req.body.passwordConf
        };
        User.create(userData, function(err, user){
          if(err){
            return next(err);
          }
          console.log('new user created');
          req.session.userId = user._id;
          return res.redirect('/profile');
        });
      }
    });

    //login route
    app.post('/api/login', function(req, res, next){

      if(req.body.logemail && req.body.logpassword){
        User.authenticate(req.body.logemail, req.body.logpassword, function(error, user){
          if(error || !user){
            var err = new Error('Wrong email or password');
            err.status = 401;
            return next(err);
          }
          req.session.userId = user._id;
          return res.redirect('/profile');
        });
      }
  });

    app.get('/profile', function(req, res, next){
      User.findById(req.session.userId)
        .exec(function(error, user){
          if(error){
            return next(err);
          } else {
            if(user === null) {
              var err = new Error('Not authorized!');
              err.status = 400;
              return next(err);
            } else {
              return res.send('<h1>Name: </h1>' + user.username + '<h2>Mail: </h2>' + user.email + '<br><a type="button" href="/api/logout">Logout</a>');
            }
          }
        });
    });

    app.get('/api/logout', function(req, res, next){
      if(req.session){
        //delete session
        req.session.destroy(function(err){
          if(err){
            return next(err);
          }
          return res.redirect('/');
        });
      }
    });

    app.listen(8080, function(){
      console.log('Server is running at http://localhost:8080');
    });
