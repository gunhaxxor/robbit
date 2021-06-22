import passport from 'passport';
import express from 'express';
import { json as parseJsonBody } from 'body-parser';
import {Strategy as LocalStrategy } from 'passport-local';
import {Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import UserModel from './models/userModel';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
const app = express();
app.use(parseJsonBody());
passport.unuse('session');
app.use(passport.initialize());
// const router = express.Router();

const JWT_SECRET = 'Gunnarääääääärbääääääst';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'bajskorv';

let currentAdminTokenId: string;

const adminRouter = express.Router();
app.use('/admin', adminRouter);

adminRouter.post('/login', 
  (req, res, next) => {
    console.log('received req body', req.body);
    next();
  },
  passport.authenticate('validateAdmin', { session: false }),
  (req, res) => {
    // console.log('request body: ', req.body);
    // console.log('whole request object:', req);
    const user = { ...req.user, admin: true };
    console.log('user on req obj:', req.user);
    const token = createAdminJWT({user}, 7200); 
    res.send(token);
  }
);

adminRouter.post('/createUser', 
  passport.authenticate('adminJwt', {session: false}),
  async (req, res) => {
    const data: Record<string, unknown> = req.body;
    const username = data.username;
    const password = data.password;
    const user = await UserModel.create({username, password});
    console.log('created user:', user);
    res.send('user created');
  }
);

function createAdminJWT(userObj: Record<string, unknown>, expiresIn = 180) {
  const tokenId = crypto.randomUUID(); 
  currentAdminTokenId = tokenId;
  const token = jwt.sign(userObj, JWT_SECRET, { expiresIn, issuer: 'gunhaxxor the master haxxor', jwtid: tokenId});
  return token;
}

adminRouter.get('/jwt-check',
  passport.authenticate('adminJwt', { session: false }),
  (req, res) => {
    res.send(req.user);
  }
);


function createJWT(userObj: Record<string, unknown>, expiresIn = 180) {
  const token = jwt.sign(userObj, JWT_SECRET, { expiresIn, issuer: 'gunhaxxor the master haxxor'});
  return token;
}

app.get('/hello', (req, res) => {
  res.send('world');
});

app.get('/jwt-check', 
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    console.log('jwt check passed');
    console.log('user on req obj:', req.user);
    res.send('success');
  });

mongoose.Promise = global.Promise;
try {
  mongoose.set('useCreateIndex', true);
  mongoose.connect('mongodb://rout:bajskorv@localhost:27017/robbit-auth', { useUnifiedTopology: true, useNewUrlParser: true, authSource: 'admin' });
} catch(err){
  console.error(err);
}
const db = mongoose.connection;
db.on('error', function(err){
  console.error('there wa an error connecting to mongo');
  console.error(err);
});
db.once('open', function() {
  console.log('connected to mongodb!!!!!');
  // console.log('creating testUser');
  // UserModel.create({username:'testarn', password:'basjkorv'});
  // const testUser = new UserModel();
  // testUser.username = 'klas';
  // testUser.password = 'bajskorv';
  // testUser.save();
});



const jwtOpts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
};
passport.use('adminJwt', new JwtStrategy(jwtOpts, function(jwtPayload, done){
  console.log('jwtPayload:', jwtPayload);
  if(jwtPayload.jti !== currentAdminTokenId){
    return done(null, false);
  }

  return done(null, jwtPayload);  
}));

passport.use(new JwtStrategy(jwtOpts, function(jwtPayload, done){
  console.log('jwtPayload:', jwtPayload);
  return done(null, jwtPayload);  
}));

passport.use('validateAdmin', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
},
async function(username, password, done){
  console.log('verify triggered with credentials: ', username, password);
  try {
    if(username === ADMIN_USERNAME && password === ADMIN_PASSWORD ){
      // const user = await UserModel.create({username, password});
      return done(null, {username, password});
    }
    return done(null, false, {message: 'fuck you' });
  } catch (err) {
    done(err);
  }
}
));

passport.use('validateUser', new LocalStrategy({
},
async function(username, password, done) {
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

const port = 3003;
app.listen(port, () => {
  console.log(`auth listening on port ${port}`);
});