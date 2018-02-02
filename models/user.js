var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  bcrypt = require('bcrypt');

var UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  passwordConf: {
    type: String,
    required: true
  }
});

UserSchema.pre('save', function(next){
  var user = this;
  bcrypt.hash(user.password, 10, function(err, hash){
    if(err){
      return next(err);
    }
    user.password = hash;
    next();
  });
});

UserSchema.statics.authenticate = function(email, password, callback){
  User.findOne({ email: email })
    .exec(function(err, user){
      if(err){
        return callback(err);
      } else if(!user){
        var err = new Error('User not found.');
        err.status = 401;
        return callback(err);
      }
      bcrypt.compare(password, user.password, function(err, result){
        if(result === true){
          return callback(null, user);
        }
        return callback();
      });
    });
};

var User = mongoose.model('User', UserSchema);
module.exports = User;