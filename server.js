// Setup basic express server

(async () => {
    const https = require('https');
    const express = require('express');
    const session = require('express-session');
    const fs = require('fs');
    const os = require("os");
    const config = require('getconfig');
    const app = express();
    const path = require('path');
    const LXDRest = await require('./bll/lxc').getInstance();



    const key = fs.readFileSync('./certificates/server.decrypted.key');
    const cert = fs.readFileSync('./certificates/server.crt');
    const server = https.createServer({ key, cert }, app);
    const expressLayouts = require('express-ejs-layouts')
    const sqlite3 = require('sqlite3').verbose();
    const { v4: uuidv4, } = require('uuid');
    

    const flash = require('express-flash')
    app.use(flash())

    let db =await new sqlite3.Database('./data/data.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to the data database.');
    });
    LXDRest.test();
    const dbm = await require("./dal/DBManager").getInstance(db, LXDRest)
    LXDRest.test();

    const io = require('socket.io')(server, {
        maxHttpBufferSize: 1e8,
        pingInterval: 35000, //was 10k, how many ms before sending a new ping packet, => how often to send a ping
        pingTimeout: 50000, //should be above 50k to fix disconnection issue how many ms without a pong packet to consider the connection closed
    });

    const siom = await require("./sio/SIOManager").getInstance(server, dbm, LXDRest, io)
    // dbManager.test()
    // dbManager.userDao.test()

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;


    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(session({
        secret: uuidv4(),
        resave: true,
        saveUninitialized: true
    }))

    const pass = await require('./bll/Passport').getInstance(app,dbm)
   
    LXDRest.checkRemoteDeviceAdded(config.lxdImageServer.name, config.lxdImageServer.ip, config.lxdImageServer.lxdTrustPassword, () => {
        console.log("Default image expecting at added")
        console.log(config.lxdImageServer.name)
        console.log(config.lxdImageServer.ip)
    })


    app.use(expressLayouts)
    app.set('view engine', 'ejs')
    app.engine('ejs', require('ejs').__express);

    app.set('views', './public/views');
    app.set('js', './public/js');

    app.use(express.static(__dirname + "/public"));

    const imageRoute = require("./routes/route.image.js");
    const loginRoutes = require("./routes/route.login.js");
    const otherRoutes = require("./routes/route.other.js");

    app.use(express.urlencoded({ extended: true }));
    imageRoute(app, pass, dbm , io, LXDRest);
    loginRoutes(app,  pass, dbm, io, LXDRest);
    otherRoutes(app,  pass, dbm, io, LXDRest);
    


    // let userMap = {};


    const port = parseInt(process.env.PORT || config.server.port, 10);


    server.listen(port, () => {
        console.log('Server listening at port %d', port);
    });


    app.use(express.static(path.join(__dirname)));
    app.use((req, res, next) => {
        res.set('Cache-Control', 'no-store')
        next()
    })

    app.set('etag', false)

})()