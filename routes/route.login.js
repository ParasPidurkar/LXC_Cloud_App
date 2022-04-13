const express = require("express");
const router = express.Router();
const controllerImage = require("../controller/controller.image.js");




let routes = (app, pass, dbm, io, LXDRest) => {

    
    router.get('', pass.checkAuthenticated, (req, res) => {
        console.log("get login page");
        console.log("userMap")
        console.log(userMap)
        console.log(req.query)
        // if (req.user != undefined) {
        //     console.log("get index page " + req.user);
        res.redirect('/index');
        //     return;
        // }
        // res.render('login', {});
    })

    router.get('/', pass.checkAuthenticated, (req, res) => {
        console.log("get login page");
        console.log("userMap")
        console.log(userMap)
        console.log(req.query)
        // if (req.user != undefined) {
        console.log("get index page " + req.user);
        res.redirect('/index');
        //     return;
        // }
        // res.render('login', {});
    })

    router.post('/login', pass.passport.authenticate('local', {
        successRedirect: '/index',
        failureRedirect: '/login',
        failureFlash: true
    }))

    router.get('/loginfid', (req, res) => {
        console.log("loginfid get method");
        res.render('loginfid', {});
    })
    //login with faceID
    router.post('/face-match', pass.passport.authenticate('fid', {
        successRedirect: '/index',
        failureRedirect: '/login',
        failureFlash: true
    }))

    router.get('/login',  (req, res) => {
        console.log("get index page /login get " + req.user);
        console.log(req.query)
        
        console.log("get login page");
        res.render('login', {});

    })


    router.get('/registration', (req, res) => {
        console.log("registration form get method");
        if (req.user != undefined) {
            res.redirect('/index');
        }
        console.log(req.query)
        res.render('registration', {});
    })

    router.get('/logout', (req, res) => {
        req.logout();
        // req.session.destroy();
        //send a socket message to update the face TOBE verified
        io.to("FacenetDevice").emit('updateImg', {});
        console.log("logged out")
        data = { error: "" }
        res.render('login', { data: data });
    });


 
  app.use(router);
};

module.exports = routes;
