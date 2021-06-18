// const passport = require('passport');
import passport from 'passport';
// const LocalStrategy = require('passport-local').Strategy;
import {Strategy as LocalStrategy } from 'passport-local';
import {Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import UserModel from './models/userModel';
import mongoose from 'mongoose';

try {

  mongoose.connect('mongodb://localhost:27017/test', { useUnifiedTopology: true, useNewUrlParser: true });
} catch(err){
  console.error(err);
}
const db = mongoose.connection;
db.once('open', function() {
  console.log('connected to mongodb!!!!!');
});

const jwtOpts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'Gunnarääääääärbääääääst',
};
passport.use(new JwtStrategy(jwtOpts, function(jwtPayload, done){
  console.log('jwtPayload:', jwtPayload);
  return done(null, {username: 'lars'});  
}));

passport.use('validateAdmin', new LocalStrategy(
  //TODO: Only admins should be allowed to create users. Check here if request is from admin user
  async function(username, password, done){
    try {
      if(username === 'admin' && password === 'bajskorv' ){
        // const user = await UserModel.create({username, password});
        return done(null, {username: 'admin', coolnessfactor: 'over 9000'});
      }
      return done(null, false, {message: 'fuck you' });
    } catch (err) {
      done(err);
    }
  }
));

passport.use('validateUser', new LocalStrategy(async function(username, password, done) {
  try {
    const user = await UserModel.findOne({username});

    if(!user){
      return done(null, false, {message: 'Fuck you!'}); // TODO: Make sure we never give client info whether it was user or password that was incorrect.
    }
    const validate = await user.isValidPassword(password);
    if(!validate) {
      return done(null, false, {message: 'Fuck you!'});
    }
    return done(null, user, {message: 'Great success!!!!!!!'});
  } catch(err) {
    return done(err);
  }
}));