const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const passport = require('passport')
let instance;
let stat = false;
let dbm;//database Manager
class Passport {

  constructor() {
    console.log("Passport constructor")
    this.passport = passport;
  }

  async init() {
    console.log("init");
    // dbm.test();
    this.passport.use(new LocalStrategy(async function (username, password, done) {
      console.log("username = " + username + " password = " + password);
      // dbm.test();
      var user  = await dbm.userDao.getUser(username);
      console.log(await bcrypt.hash(password, 10))
      if (!user || ! await bcrypt.compare(password, user.password)) return done(null, false);
      console.log(await bcrypt.compare(password, user.password))
      
      console.log("...............login = "+user.userId)
      return done(null, user);
    }));

    this.passport.use('fid',new LocalStrategy(async function (username, password, done) {
      console.log("LocalStrategy + 1 ................... test")
      
      console.log("username = " + username + " password = " + password);
      // dbm.test();
      var user  = await dbm.userDao.getUser(username);
      console.log(await bcrypt.hash(password, 10))
      if (!user || ! await bcrypt.compare(password, user.password)) return done(null, false);
      console.log(await bcrypt.compare(password, user.password))
      
      console.log("...............login = "+user.userId)
      return done(null, user);
    }));

    passport.serializeUser(function (user, done) {
      console.log("serializeUser = ")
      // console.log(user)
      return done(null, user.userId);
    });

    passport.deserializeUser(async function (id, done) {
      console.log("deserializeUser")
      console.log(id)
      return done(null, id);
    });
  }


  checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }

    res.redirect('/login')
  }

  checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }
    next()
  }

  test() {
    console.log("Passport test")
  }

  static getInstance(app, dbManager) {
    return new Promise(async (resolve, reject) => {
      console.log("getInstance")
      dbManager.test()
      if (!instance) {
        if (!stat && dbManager && app) {
          stat = true
          dbm = dbManager;
          instance = await new Passport()
          await instance.init()
          app.use(passport.initialize())
          app.use(passport.session())
          
          stat = false
        } else {
          throw new Error(`error: Failed to instantiate DBManager possible reason (in-progress, unavailable dependency injection)  `);
        }
      }
      resolve(instance)

    })
  }
}


module.exports = Passport




// module.exports = initialize