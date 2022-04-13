const express = require("express");
const router = express.Router();
// const controllerImage = require("../controller/controller.other.js");

const fs = require('fs');
const os = require("os");
const config = require('getconfig');

let db


let routes = (app, pass, dbm, io, LXDRest) => {
    db = dbm.db
 
    router.post('/registration', pass.checkAuthenticated , (req, res) => {
        console.log("registration form post method");
        //console.log(req.body)
        if ((req.body.faceId).length == 0) {
            console.log("Try enrolling with valid face ID", (req.body.faceId).length)
        }
        if ((req.body.faceId).length) {
            db.run(`INSERT INTO userInfo(userId, firstName, lastName, email, password, faceId) VALUES("${req.body.username}", "${req.body.firstname}", "${req.body.lastname}","${req.body.email}", "${req.body.password}","${req.body.faceId}")`,
                function (err) {
                    if (err) {
                        return console.log(err.message);
                    }

                    console.log("entry added to table");
                });
        }

        var img = req.body.faceId;
        var username = req.body.username;
        var lastname = req.body.lastname;
        io.to("FacenetDevice").emit('Face-Enroll', { data1: username, data2: lastname, data3: img })
        //we are storing the image name based on the userName given by user 
        /*  var enroll_name = req.body.userName + ".jpg";
          var img_path = "/images/ai/enroll/" + enroll_name;
          // strip off the data: url prefix to get just the base64-encoded bytes
          var data = img.replace(/^data:image\/\w+;base64,/, "");
          var buf = new Buffer.from(data, 'base64');
    
          fs.writeFile('image.jpg', buf, err => {
              if (err) throw err;
              console.log('Saved the image of the!');
          });*/


        res.render('login', {});
    })

    router.delete('/image', pass.checkAuthenticated , (req, res) => {
        console.log("delete image");
        console.log(req.body)
        console.log("query")
        console.log(req.query)

        LXDRest.imagedelete(
        ).then(function (response) {

            if (response.returnValue) {
                var query = `UPDATE imageConfig set publish = 1 WHERE name = "${req.body.data.imageName}" ;`
                db.run(query,
                    function (err) {
                        if (err) {
                            return console.log(err.message);
                        }
                        console.log("entry updated to table");
                    });
            }
            console.log(response)
            res.json(response);
        }).catch(function (e) {
            console.log(e);
            res.json(e);
        });

    })

    router.get('/localImages', pass.checkAuthenticated , (req, res) => {
        console.log("hubInfo get method");
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
        dbm.userDao.getUserData(req.user, (userData, info, settings) => {
            var data = {
                "userName": req.user,
                "userMap": userData,
                "deviceName": req.session.deviceName,
                "info": info,
                "setting": settings
            }

            if (io.sockets.adapter.rooms.get(req.session.deviceName) == null) {
                console.log("socket not found for room = " + req.session.deviceName)
                data.images = [];
                res.render('localImages', { data: data });
                return;
            }
            console.log("ip = " + io.sockets.sockets.get(Array.from(io.sockets.adapter.rooms.get(req.session.deviceName))[0]).ip)
            // dbm.imageDao.getImagesInfo(cb,io.sockets.sockets.get(Array.from(io.sockets.adapter.rooms.get(req.session.deviceName))[0]).ip)

            dbm.imageDao.getImagesInfo((images) => {
                console.log("images on container hub")
                console.log(images)
                data.images = images;

                res.render('localImages', { data: data });
            }, io.sockets.sockets.get(Array.from(io.sockets.adapter.rooms.get(req.session.deviceName))[0]).ip)

        })
        // }
    })


    router.get('/hubInfo', pass.checkAuthenticated , (req, res) => {
        console.log("hubInfo get method");
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
        dbm.userDao.getUserData(req.user, (userData, info, settings) => {
            dbm.imageDao.getImagesInfo((images) => {
                console.log("images on container hub")
                console.log(images)
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "info": info,
                    "images": images,
                    "setting": settings
                }

                res.render('hubInfo', { data: data });
            })

        })
        // }
    })

    router.get('/configImg', pass.checkAuthenticated , (req, res) => {
        console.log("get index page userName " + req.user);
        console.log("get index page deviceName " + req.session.deviceName);
        console.log(req.query)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
        dbm.userDao.getUserData(req.user, (userData, info, settings) => {
            var data = {
                "userName": req.user,
                "userMap": userData,
                "deviceName": req.session.deviceName,
                "info": info,
                "setting": settings
            }
            if (io.sockets.adapter.rooms.get("imageBuilder") != undefined) {
                console.log(Array.from(io.sockets.adapter.rooms.get("imageBuilder")))
                data.imageBuilder = [];
                for (let index = 0; index < Array.from(io.sockets.adapter.rooms.get("imageBuilder")).length; index++) {
                    // const element = Array.from(io.sockets.adapter.rooms.get("imageBuilder"))[index];
                    console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
                    console.log(io.sockets.sockets.get(Array.from(io.sockets.adapter.rooms.get("imageBuilder"))[index]).config);
                    var builderInfo = io.sockets.sockets.get(Array.from(io.sockets.adapter.rooms.get("imageBuilder"))[index]).config
                    builderInfo.socketId = Array.from(io.sockets.adapter.rooms.get("imageBuilder"))[index]
                    data.imageBuilder.push(builderInfo)
                }
            }
            console.log(data)
            res.render('configImg', { data: data });
        })
        // }
    })






    router.get('/statusImg', pass.checkAuthenticated , (req, res) => {
        console.log("statusImg form get method");
        console.log("get statusImg page " + req.user);
        console.log(req.query)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
        var data;
        dbm.userDao.getUserData(req.user, (userData, info, settings) => {
            data = {
                "userName": req.user,
                "userMap": userData,
                "deviceName": req.session.deviceName,
                "info": info,
                "imageName": req.session.imageName,
                "setting": settings
            }


            console.log("........,,,,,,,,,,,,,,,,,,,,,")
            if (req.query.numBuilder == 0) {
                data.error = "Note: No builder available for provided architecture !!!"
                var data_log = data.error2;
                var status ="waiting"
                db.run(`INSERT INTO userQueries(userId,query, status) VALUES("${req.user}", "${data_log}", "${status}")`,
                function(err) {
                    if (err) {
                        console.log("@@@@@"+req.body)
                        return console.log(err.message);
                    }
        
                    console.log("entry added to query table 2");
                 });
            }

            // if (req.query.imageName != undefined) {
            //     getImageConfigInfo(req.query.imageName, (rows) => {
            //         if (rows.length != 1) {
            //             data.error2 = "Note: Ambiguous Image Name !!!"
            //         } else {
            //             data.imageInfo = rows[0];
            //         }

            //         res.render('statusImg', { data: data });
            //     })
            // }else
            if (req.session.imageName != undefined) {
                dbm.imageDao.getImageConfigInfo(req.session.imageName, (rows) => {
                    if (rows.length > 1) {
                        data.error2 = "Note: Ambiguous Image Name !!!"
                        var data_log = data.error2;
                var status ="waiting"
                db.run(`INSERT INTO userQueries(userId,query, status) VALUES("${req.session.userName}", "${data_log}", "${status}")`,
                function(err) {
                    if (err) {
                        console.log("@@@@@"+req.body)
                        return console.log(err.message);
                    }
        
                    console.log("entry added to query table 2");
                 });
                    } else {
                        data.imageInfo = rows[0];
                    }

                    res.render('statusImg', { data: data });
                })

            } else
                res.render('statusImg', { data: data });
        })

        // }
    })



    router.get('/error_device', pass.checkAuthenticated , (req, res) => {
        console.log("device error page");
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {

            dbm.userDao.getUserData(req.user, (userData, userInfo, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "userInfo": userInfo,
                    "setting": settings
                }
                console.log("CHECKING THE ERROR DEVICE DATA");
                console.log(data);
                res.render('error_device', { data: data });
            })

        // }
    })


    router.post('/configImg', pass.checkAuthenticated , (req, res) => {
        console.log("configImg form post method");
        console.log(req.body)


        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
            var sqlQuery = `INSERT INTO imageConfig(userId, name, architecture, os, deviceSupport, serviceSupport, detail, status, deviceType, buildServer, formData) 
        VALUES("${req.user}", "${req.body.imageName}", "${req.body.architecture}","${req.body.os}", 
        json('${JSON.stringify(req.body.devices)}'),  json('${JSON.stringify(req.body.services)}'), "${req.body.description}", 
        0, "${req.body.device}", "${req.body.buildServer}", json('${JSON.stringify(req.body)}'))`

            console.log(sqlQuery);

            req.session.imageName = req.body.imageName;
            db.run(sqlQuery, function (err) {
                if (err) {
                    return console.log(err.message);
                }

                console.log("entry added to table");
                // res.redirect('/general');
            });
            const build = io.sockets.sockets.get(req.body.buildServer);
            const numBuilder = build != undefined ? 1 : 0;

            if (req.body.mode == "local") {
                var socket = io.sockets.sockets.get(Array.from(io.sockets.adapter.rooms.get(req.body.publishTo))[0])
                req.body.publishToIP = socket.ip;
                req.body.publishToLxdAdminPassword = socket.lxdTrustPassword;
            } else { //global case
                req.body.publishTo = config.lxdImageServer.name;
                req.body.publishToIP = config.lxdImageServer.ip;
                req.body.publishToLxdAdminPassword = config.lxdImageServer.lxdTrustPassword;
            }


            console.log("......................req.body = " + req.body);
            console.log(req.body)

            //io.to("build_" + req.body.architecture).emit('build', { payload: { type: "buildContainer", formData: req.body, userName: req.user } });
            io.sockets.sockets.get(req.body.buildServer).emit('build', { payload: { type: "buildContainer", formData: req.body, userName: req.user } });

            res.redirect('/statusImg?numBuilder=' + numBuilder);
        // }



    });



    router.post('/delete', pass.checkAuthenticated , (req, res) => {
        console.log("post delete page");
        console.log(req.body)

        db.run(`DELETE FROM containerInfo WHERE deviceId = "${req.body.deviceName}" AND containerName = "${req.body.containerName}";`,
            function (err) {
                if (err) {
                    return console.log(err.message);
                }

                console.log("entry deleted from table containerInfo");
            });

        var message = {}
        message.payload = req.body;
        message.payload.type = "deleteExistingContainer"
        console.log(message)
        io.to(req.body.deviceName).emit('message', message);
        res.redirect('/general');
    });



    router.post('/start', pass.checkAuthenticated , (req, res) => {
        console.log("post start page");
        console.log(req.body)
        var message = {}
        message.payload = req.body;
        message.payload.type = "startExistingContainer"
        console.log(message)
        io.to(req.body.deviceName).emit('message', message);
        res.redirect('/general');
    });

    router.post('/stop', pass.checkAuthenticated , (req, res) => {
        console.log("post stop page");
        var message = {}
        message.payload = req.body;
        message.payload.type = "stopExistingContainer"
        console.log(req.body)
        console.log(message)
        io.to(req.body.deviceName).emit('message', message);
        res.redirect('/general');
    });


    var request, response;

    router.post('/face-match', pass.checkAuthenticated , (req, res) => {
        console.log("face-match called ")
        //console.log(req.body)
        console.log(req.body.userName)
        //const { spawn } = require('child_process');

        console.log("matching the face ")
        var img = req.body.faceId;
        var password = req.body.userName;
        //strip off the data: url prefix to get just the base64-encoded bytes
        var data = img.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer.from(data, 'base64');
        fs.writeFile('./public/images/ai/log/face/face.jpg', buf, err => {
            if (err) throw err;
            console.log('Saved!');
        });
        //sending the registered face here
        request = req;
        response = res
        io.to("FacenetDevice").emit('Face-Register', { data: img, data1: password });


        var cb = (msg) => {
            console.log("callback ")
            //console.log(data)
            console.log("Matched face Id  " + msg.data)
            var FaceIdUserName = msg.data.toString();
            var password = msg.data1;
            console.log("FaceId  is =>" + msg.data)
            console.log("password  is =>" + msg.data1)
            FaceIdUserName = FaceIdUserName.slice(0)
            FaceIdUserName = FaceIdUserName.slice(0, -4)
            console.log("FaceId is =>", FaceIdUserName)
            password = password.slice(1)
            password = password.slice(0, -1)
            console.log("password  is =>" + password)
            //response.redirect('/index');

            console.log(`SELECT *
    FROM userInfo WHERE userId = "${FaceIdUserName}" AND password = "${password}"`)
            db.serialize(() => {

                db.each(`SELECT *
                 FROM userInfo WHERE userId = "${FaceIdUserName}" AND password = "${password}"`, (err, row) => {

                    if (err) {
                        console.error(err.message);
                        data = { error: "Username or password not match1." };
                        res.render('login', { data: data });
                        return
                    }
                    //console.log(row.userId);
                    console.log("-----select userId and password-------");
                    console.log(row);
                    if (row != undefined && row.userId) {
                        //numUsers++;
                        var hour = 3600000
                        req.session.cookie.expires = new Date(Date.now() + hour);
                        req.session.cookie.maxAge = hour;
                        req.user = FaceIdUserName;
                        res.redirect('/index');
                        return
                    } else {
                        data = { error: "Username or password not match2." };
                        res.render('login', { data: data });
                        return
                    }
                },
                    (err, numberOfRows) => {
                        if (err) {
                            console.error(err.message);
                            data = { error: "Username or password not match3." };
                            res.render('login', { data: data });
                            return

                        }

                        console.log(`There were ${numberOfRows} containers`);
                        if (numberOfRows == 0) {
                            data = { error: "Username or password not match4." };
                            res.render('login', { data: data });
                            return
                        }
                    }
                );
            });
        }

        // io.sockets.adapter.rooms.get("FacenetDevice")[0]
        console.log(io.sockets.adapter.rooms.get("FacenetDevice"))

        if (io.sockets.adapter.rooms.get("FacenetDevice") != undefined && io.sockets.adapter.rooms.get("FacenetDevice").size != 0) {
            console.log(Array.from(io.sockets.adapter.rooms.get("FacenetDevice"))[0])

            const myFacenetDevice = io.sockets.sockets.get(Array.from(io.sockets.adapter.rooms.get("FacenetDevice"))[0]);
            //myFacenetDevice.emit('face-match', { test: "test" });
            myFacenetDevice.once('FaceIddata', cb)
        } else {
            data = { error: "Facenet service is down" };
            res.render('login', { data: data });
        }
    });


    router.get('/index', pass.checkAuthenticated, (req, res) => {
        console.log("req.user = "+req.user)
        console.log("get index page  123" + req.user);
        console.log(req.query)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {

        dbm.userDao.getUserData(req.user, (userData, info, settings) => {
            var data = {
                "userName": req.user,
                "userMap": userData,
                "deviceName": req.session.deviceName,
                "info": info,
                "setting": settings
            }


            res.render('index', { data: data });
            // var cb = (rows) => {
            //     data.userConfiguredImages = rows;

            //     res.render('index', { data: data });
            // }
            // dbm.imageDao.getImagesInfo(cb)
            // console.log("........,,,,,,,,,,,,,,,,,,,,,")
            // console.log(JSON.stringify(data))

        })

        // }

    })

    // For notifications
    router.get('/notification', pass.checkAuthenticated , (req, res) => {
        console.log("get notification page " + req.user);
        console.log(req.query)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {

            dbm.userDao.getUserData(req.user, (userData, userInfo, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "userInfo": userInfo,
                    "setting": settings
                }


                // console.log("........,,,,,,,,,,,,,,,,,,,,,")
                // console.log(JSON.stringify(data))
                res.render('notification', { data: data });
            })

        // }

    })







    router.get('/query', (req, res) => {
        console.log("Getting the query data ")
        console.log("USERNAME")
        console.log(req.query)
    
        console.log(`SELECT *  FROM userQueries where userId ="${req.query.username}";`)
        db.all(`SELECT * FROM userQueries where userId ="${req.query.username}";`,
            (error, rows) => {
                var ans = {};
                console.log(rows);
                // callback(rows)
                ans.rows = rows;
                res.json(ans)
            });
    });



// For FAQ

    router.get('/faq',pass.checkAuthenticated , (req, res) => {
        console.log("get notification page " + req.user);
        console.log(req.query)
        // if (req.session.userName == undefined) {
        //     res.render('login', {});
        // } else {
    
            dbm.userDao.getUserData(req.user, (userData, userInfo, settings,queries) => {
                var data = {
                    "userName": req.userName,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "userInfo": userInfo,
                    "setting": settings,
                    "query":queries
                }
    
    
                // console.log("........,,,,,,,,,,,,,,,,,,,,,")
                // console.log(JSON.stringify(data))
                res.render('faq', { data: data });
            })
    
        // }
    
    })
    

    // For Settings
    router.get('/settings', pass.checkAuthenticated , (req, res) => {
        console.log("get settings page " + req.user);+
        console.log(req.query)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {

            dbm.userDao.getUserData(req.user, (userData, userInfo, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "userInfo": userInfo,
                    "setting": settings
                }


                // console.log("........,,,,,,,,,,,,,,,,,,,,,")
                // console.log(JSON.stringify(data))
                res.render('settings', { data: data });
            })

        // }

    })

    router.post('/settings', pass.checkAuthenticated , (req, res) => {
        console.log("get settings page " + req.user);
        console.log("THIS IS THE TEST FOR SETTINGS")
        console.log(req.body)

        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {

            // var sett = JSON.parse(req.body);


            db.run(`INSERT INTO userSettings(userId, bcolor, bimage,fsize, fcolor, headfsize, headfcolor , subheadfsize, subheadfcolor , cardfsize, cardfcolor, headcardfsize, headcardfcolor,sidebarfsize,sidebarfcolor,sidebarbackcolor,sidebarheadfsize,sidebarheadfcolor) VALUES("${req.user}","${req.body.backcolor}", "${req.body.backimage}","${req.body.fontsize}", "${req.body.fontcolor}","${req.body.headfontsize}", "${req.body.headfontcolor}","${req.body.subheadfontsize}", "${req.body.subheadfontcolor}","${req.body.cardfontsize}", "${req.body.cardfontcolor}","${req.body.headcardfontsize}", "${req.body.headcardfontcolor}"  , "${req.body.sidebarfontsize}" , "${req.body.sidebarfontcolor}" , "${req.body.sidebarbackcolor}" , "${req.body.sidebarheadfontsize}" , "${req.body.sidebarheadfontcolor}")
        on CONFLICT("userId") 
             do UPDATE set bcolor = "${req.body.backcolor}",bimage = "${req.body.backimage}", fsize = "${req.body.fontsize}", fcolor = "${req.body.fontcolor}", headfsize = "${req.body.headfontsize}", headfcolor = "${req.body.headfontcolor}" , subheadfsize = "${req.body.subheadfontsize}", subheadfcolor = "${req.body.subheadfontcolor}" , cardfsize = "${req.body.cardfontsize}", cardfcolor = "${req.body.cardfontcolor}", headcardfsize = "${req.body.headcardfontsize}", headcardfcolor = "${req.body.headcardfontcolor}" , sidebarfsize = "${req.body.sidebarfontsize}" , sidebarfcolor = "${req.body.sidebarfontcolor}" , sidebarbackcolor = "${req.body.sidebarbackcolor}", sidebarheadfsize = "${req.body.sidebarheadfontsize}" , sidebarheadfcolor = "${req.body.sidebarheadfontcolor}";)`,
                function (err) {
                    if (err) {
                        return console.log(err.message);
                    }

                    console.log("entry added to settings table");
                });
            dbm.userDao.getUserData(req.user, (userData, userInfo, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "userInfo": userInfo,
                    "setting": settings
                }

                console.log("........,,,,,,,,,,,,,,,,,,,,,")
                console.log(JSON.stringify(data))

                res.render('index', { data: data });
            })
        // }

    })




    router.get('/device', pass.checkAuthenticated , (req, res) => {
        console.log("get device page " + req.user);
        console.log(req.query)
        req.session.deviceName = req.query.deviceName;
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
            dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "info": info,
                    "setting": settings
                }

                res.render('device', { data: data });
            })


        // }

    })





    router.post('/bookmark_deletion', (req, res) => {
        // console.log("get settings page " + req.session.userName);
         console.log("THIS IS THE TEST FOR BOOKMARK DELETION")
         let datares = JSON.stringify(req.body.data);
        console.log("getting the bookmark url"+datares)
         console.log(req.body)
         console.log("This is the bookmarklink"+req.body.data.ID);
         console.log("Tag1")
         if (req.session.userName == undefined) {
             res.render('login', {});
         } else {
             db.run(`DELETE FROM userBookmarks WHERE ID=?`,`${req.body.data.ID}`,
                  function(err) {
                     if (err) {
                         return console.log(err.message);
                     }
     
                     console.log("entry removed from bookmark table");
                 });
                 dbm.userDao.getUserData(req.user, (userData, userInfo, settings,queries) => {
                    var data = {
                        "userName": req.user,
                        "userMap": userData,
                        "deviceName": req.session.deviceName,
                        "userInfo": userInfo,
                        "setting": settings,
                        "query":queries
                    }
                });
        
     
                 console.log("BOOKMARK LOG")
         }
         //res.render('index',{})
     })


     router.post('/notification_deletion', (req, res) => {
        // console.log("get settings page " + req.session.userName);
         console.log("THIS IS THE TEST FOR NOTIFICATIONS DELETION")
         let datares = JSON.stringify(req.body.data);
        console.log("getting the username"+datares)
         console.log(req.body)
         console.log("This is the bookmark ID := "+req.body.data.ID);
         if (req.user == undefined) {
             res.render('login', {});
         } else {
             db.run(`DELETE FROM userQueries WHERE ID=?`,`${req.body.data.ID}`,
                  function(err) {
                     if (err) {
                         return console.log(err.message);
                     }
     
                     console.log("entry removed from notification table");
                 });
                 dbm.userDao.getUserData(req.user, (userData, userInfo, settings,queries) => {
                    var data = {
                        "userName": req.user,
                        "userMap": userData,
                        "deviceName": req.session.deviceName,
                        "userInfo": userInfo,
                        "setting": settings,
                        "query":queries
                    }
                    res.render('notification',{data:data})
                });
        
     
                 console.log("POST NOTIFICATIONS  LOG")
                 
         }
         //res.render('notification',{})
     })






     router.post('/notification_alldeletion', (req, res) => {
        // console.log("get settings page " + req.session.userName);
         console.log("THIS IS THE TEST FOR ALL NOTIFICATIONS DELETION")
         let datares = JSON.stringify(req.body.data);
        console.log("getting the username"+datares)
         console.log(req.body)
         console.log("This is the notification ID := "+req.body.data.username);
         if (req.user == undefined) {
             res.render('login', {});
         } else {
             db.run(`DELETE FROM userQueries WHERE userId=?`,`${req.body.data.username}`,
                  function(err) {
                     if (err) {
                         return console.log(err.message);
                     }
     
                     console.log("entry removed from  all notification table");
                 });
                 dbm.userDao.getUserData(req.user, (userData, userInfo, settings,queries) => {
                    var data = {
                        "userName": req.user,
                        "userMap": userData,
                        "deviceName": req.session.deviceName,
                        "userInfo": userInfo,
                        "setting": settings,
                        "query":queries
                    }
                    res.render('notification',{data:data})
                });
        
     
                 console.log("POST NOTIFICATIONS  LOG")
                 
         }
        // res.render('notification',{})
     })
    
    
     router.post('/bookmarks', pass.checkAuthenticated , (req, res) => {
        // console.log("get settings page " + req.session.userName);
         console.log("THIS IS THE TEST FOR BOOKMARK")
         let datares = JSON.stringify(req.body.data.urls);
        console.log("getting the bookmark url"+datares)
         console.log(req.body)
         console.log("This is the actual message"+req.body.data.urls);
        //  if (req.session.userName == undefined) {
        //      res.render('login', {});
        //  } else {
             db.run(`INSERT INTO userBookmarks(userId, bookmark,alias) VALUES("${req.user}","${req.body.data.urls}","${req.body.data.alias}")`,
                  function(err) {
                     if (err) {
                         return console.log(err.message);
                     }
     
                     console.log("entry added to bookmarks table");
                 });
             
     
         //     db.each(`
         // with user as (
         //   select * from userBookMarks where userId = "${userName}"
         // )
         // select
         // bm.bookmark,bm.alias
         // from
         //   user
         //   left join userBookMarks bm on user.userId = bm.userId`,
         dbm.userDao.getUserData(req.user, (userData, userInfo, settings,queries) => {
             var data = {
                 "userName": req.user,
                 "userMap": userData,
                 "deviceName": req.session.deviceName,
                 "userInfo": userInfo,
                 "setting": settings,
                 "query":queries
             }
         });
     
     
                 console.log("BOOKMARK LOG")
                 //console.log(JSON.stringify(data))
     
                // res.render('index', { data:data});
            // })
        // }
     })






     router.get('/bookmarks', (req, res) => {
        console.log("THIS IS THE TEST FOR BOOKMARK GET")
        console.log("USERNAME")
        console.log(req.query)
    
        console.log(`SELECT *  FROM userBookMarks where userId ="${req.query.username}";`)
        db.all(`SELECT * FROM userBookMarks where userId ="${req.query.username}";`,
            (error, rows) => {
                var ans = {};
                console.log(rows);
                // callback(rows)
                ans.rows = rows;
                res.json(ans)
            });
    });

    

    router.get('/error_container', pass.checkAuthenticated , (req, res) => {
        console.log("container_error page " + req.user);
        console.log(req.query)
        req.session.deviceName = req.query.deviceName;
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
            dbm.userDao.getUserData(req.user, (userData, userInfo, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "userInfo": userInfo,
                    "setting": settings
                }
                console.log("ERROR IN CONTAINER INFO");
                console.log(data);
                res.render('error_container', { data: data });
            })

        // }
    })







    router.post('/queries', pass.checkAuthenticated , (req, res) => {
        console.log("get settings page " + req.user);
        console.log("THIS IS THE TEST FOR Query")
        console.log(req.body)
        var stat ="Not responded"
        console.log("This is the actual message"+req.body.msg);
        if (req.user == undefined) {
            res.render('login', {});
        } else {
            db.run(`INSERT INTO userQueries(userId, query,status) VALUES("${req.user}","${req.body.msg}","${stat}")`,
                 function(err) {
                    if (err) {
                        return console.log(err.message);
                    }
    
                    console.log("entry added to queries table");
                });
                dbm.userDao.getUserData(req.user, (userData, userInfo, settings,queries) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "userInfo": userInfo,
                    "setting": settings,
                    "query" : queries
                }
    
                console.log("queries log")
                console.log(JSON.stringify(data))
    
                res.render('index', { data: data });
            })
        }
    
    })
    

    router.get('/info', pass.checkAuthenticated , (req, res) => {
        console.log("get index page " + req.user);
        console.log(req.query)
        req.session.containerName = req.query.containerName;
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {

            dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "info": info,
                    "containerName": req.session.containerName,
                    "setting": settings
                }

                res.render('info', { data: data });
            })
        // }

    })

    router.get('/error_info', pass.checkAuthenticated , (req, res) => {
        console.log("get error page " + req.user);
        console.log(req.query)
        req.session.containerName = req.query.containerName;
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
            // var data = {
            //     "userName": req.user,
            //     "userMap": userMap[req.user],
            //     "deviceName": req.session.deviceName,
            //     "containerName": req.session.containerName
            // }
            // res.render('info', { data: data });

            dbm.userDao.getUserData(req.user, (userData, userInfo, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "userInfo": userInfo,
                    "containerName": req.session.containerName,
                    "setting": settings
                }


                // console.log("........,,,,,,,,,,,,,,,,,,,,,")
                // console.log(JSON.stringify(data))
                res.render('error_info', { data: data });
            })
        // }

    })

    router.get('/general', pass.checkAuthenticated , (req, res) => {
        console.log("get index page " + req.user);
        console.log(req.query)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {

            dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "info": info,
                    "setting": settings
                }
                res.render('general', { data: data });
            })


        // }

    })

    router.get('/generalserver', pass.checkAuthenticated , (req, res) => {
        console.log("get index page " + req.user);
        console.log(req.query)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {

            //dbm.userDao.getUserData(req.user, (userData, info, settings) => {
            //    getbuildServerData((buildConfig) => {
            //    console.log(buildConfig)
            //    var data = {
            //        "userName": req.user,
            //        "setting": settings,
            //        "buildConfig": buildConfig
            //    }
            //		res.render('generalserver', { data: data });
            //	})

            //})

            var userData = () => {
                dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                    dbm.buildConfigDao.getbuildServerData((buildConfig) => {
                        console.log(buildConfig)
                        var data = {
                            "userName": req.user,
                            "userMap": userData,
                            "info": info,
                            "setting": settings,
                            "buildConfig": buildConfig
                        }
                        var cb2 = (rows) => {
                            data.userConfiguredImages = rows;

                            console.log("........,,,,,,,,,,,,,,,,,,,,,")
                            console.log(data)
                            // console.log(JSON.stringify(data))
                            res.render('generalserver', { data: data });
                        }

                        var cb = (rows) => {
                            data.images = rows;
                            dbm.imageDao.getUserImageConfigInfo(req.user, cb2)
                        }
                        dbm.imageDao.getImagesInfo(cb)
                    })
                })
            }

            if (req.query.closeNotificationImageName != undefined) {
                console.log(`UPDATE imageConfig set displayNotification = 0 WHERE name = "${req.query.closeNotificationImageName}" ;`)
                db.run(`UPDATE imageConfig set displayNotification = 0 WHERE name = "${req.query.closeNotificationImageName}" ;`,
                    function (err) {
                        if (err) {
                            return console.log(err.message);
                        }
                        console.log("entry updated to table");
                        userData();
                    });
            } else {
                userData();
            }

        // }

    })

    router.get('/health', pass.checkAuthenticated , (req, res) => {
        console.log("get index page " + req.user);
        console.log(req.query)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {

            dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "info": info,
                    "setting": settings
                }


                console.log("........,,,,,,,,,,,,,,,,,,,,,")
                //console.log(JSON.stringify(data))
                res.render('health', { data: data });
            })


        // }

    })

    router.get('/status', pass.checkAuthenticated , (req, res) => {
        console.log("get status page " + req.user);
        console.log("get status................");
        console.log(req.query)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
            dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "info": info,
                    "containerName": req.session.containerName,
                    "setting": settings
                }


                console.log("........,,,,,,,,,,,,,,,,,,,,,")
                if (req.query.numPublisher == 0 && config.containerType != "lxd") {
                    data.error = "Note: Publisher is not available please retry after some time !!!"
                    var data_log = data.error;
                var status ="waiting"
                db.run(`INSERT INTO userQueries(userId,query, status) VALUES("${req.user}", "${data_log}", "${status}")`,
                function(err) {
                    if (err) {
                        console.log("@@@@@"+req.body)
                        return console.log(err.message);
                    }
        
                    console.log("entry added to query table 2");
                 });
                }
                if (req.query.numSubscriber == 0) {
                    data.error2 = "Note: Subscriber (device) is not available please connect and retry !!!"
                    var data_log = data.error2;
                var status ="waiting"
                db.run(`INSERT INTO userQueries(userId,query, status) VALUES("${req.user}", "${data_log}", "${status}")`,
                function(err) {
                    if (err) {
                        console.log("@@@@@"+req.body)
                        return console.log(err.message);
                    }
        
                    console.log("entry added to query table 2");
                 });
                }
                res.render('status', { data: data });
                //console.log(JSON.stringify(data))
            })
        // }

    })


    router.get('/statuses', pass.checkAuthenticated , (req, res) => {
        console.log("get status page " + req.user);
        console.log("get status................");
        console.log(req.query)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
            dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "info": info,
                    "containerName": req.session.containerName,
                    "from": req.query.from,
                    "setting": settings
                }

                var cb = (rows) => {
                    data.userConfiguredImages = rows;

                    if (req.query.numPublisher == 0) {
                        data.error = "Note: Publisher is not available please retry after some time !!!"
                        var data_log = data.error;
                var status ="waiting"
                db.run(`INSERT INTO userQueries(userId,query, status) VALUES("${req.user}", "${data_log}", "${status}")`,
                function(err) {
                    if (err) {
                        console.log("@@@@@"+req.body)
                        return console.log(err.message);
                    }
        
                    console.log("entry added to query table 2");
                 });
                    }
                    if (req.query.numSubscriber == 0) {
                        data.error2 = "Note: Subscriber (device) is not available please retry after some time !!!"
                        var data_log = data.error2;
                var status ="waiting"
                db.run(`INSERT INTO userQueries(userId,query, status) VALUES("${req.user}", "${data_log}", "${status}")`,
                function(err) {
                    if (err) {
                        console.log("@@@@@"+req.body)
                        return console.log(err.message);
                    }
        
                    console.log("entry added to query table ");
                 });
                    }
                    console.log("........,,,,,,,,,,,,,,,,,,,,,")
                    console.log(data)
                    console.log(JSON.stringify(data))
                    res.render('statuses', { data: data });
                }
                dbm.imageDao.getUserImageConfigInfo(req.user, cb)


                //console.log(JSON.stringify(data))
            })
        // }

    })

    router.get('/config', pass.checkAuthenticated , (req, res) => {
        console.log("get index page userName " + req.user);
        console.log("get index page deviceName " + req.session.deviceName);
        console.log(req.query)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
            // var data = {
            //     "userName": req.user,
            //     "userMap": userMap[req.user],
            //     "deviceName": req.session.deviceName
            // }

            // res.render('config', { data: data });

            // const build = io.sockets.adapter.rooms.get("build_" + req.body.architecture);
            // const numBuilder = build ? build.size : 0;
            // console.log("......................numBuilder = " + numBuilder);

            // io.to("build_" + req.body.architecture).emit('updateHubImageInfo', {});

            dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                dbm.imageDao.getImagesInfo((images) => {
                    var data = {
                        "userName": req.user,
                        "userMap": userData,
                        "deviceName": req.session.deviceName,
                        "info": info,
                        "images": images,
                        "setting": settings
                    }

                    dbm.imageDao.getImagesInfo((localImages) => {
                        data.localImages = localImages;
                        res.render('config', { data: data });
                    }, io.sockets.sockets.get(Array.from(io.sockets.adapter.rooms.get(req.session.deviceName))[0]).ip)

                    //console.log("........,,,,,,,,,,,,,,,,,,,,,")
                    //console.log(JSON.stringify(data))

                })


            })
        // }
    })


    router.post('/config', pass.checkAuthenticated , (req, res) => {
        console.log("post config page " + req.user);
        console.log(req.body)
        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
            req.session.containerName = req.body.containerName;
            console.log(".........................")
            const publisher = io.sockets.adapter.rooms.get('publisher');
            const numPublisher = publisher ? publisher.size : 0;
            console.log("number of publisher  = " + numPublisher);

            const subscriber = io.sockets.adapter.rooms.get(req.session.deviceName);
            const numSubscriber = subscriber ? subscriber.size : 0;
            console.log("number of device (subscriber) = " + numSubscriber);

            if (numPublisher == 0 && config.containerType != "lxd") {
                console.log("Publisher or subscriber is not available")
            } else {
                console.log("Publisher are available")
                var data = {
                    "userName": req.user,
                    "deviceName": req.session.deviceName,
                    "formData": req.body
                }

                // db.run(`INSERT INTO "containerInfo" ("containerName",  "profile", "type") VALUES ("${req.body.containerName}", "${req.body.profile}", "${req.body.device}") WHERE userId = "${req.user}" and deviceId = "${req.session.deviceName}";`,
                // function(err) {
                //     if (err) {
                //         return console.log(err.message);
                //     }
                //     console.log("entry added to table");
                // });

                //db.run(`INSERT INTO "containerInfo" ("containerName",  "profile", "type", "info") VALUES ("${req.body.containerName}", "${req.body.profile}", "${req.body.device}") ON CONFLICT("deviceId") DO UPDATE SET "deviceStatus" = 'connected';`,
                var form_info = JSON.stringify(req.body);
                var run_detail = { State: "NOT CREATED" };
                console.log(".............\\")
                console.log(`INSERT INTO "containerInfo" ("userId", "containerName", "deviceId", "profile", 
            "type", "containerStatus", "runningDetails", "info", "services") VALUES ("${req.user}",
            "${req.body.containerName}" , "${req.session.deviceName}", "${req.body.profile}", "${req.body.device}",
             "CREATING", '${JSON.stringify(run_detail)}', '${form_info}', '{}') on CONFLICT("containerName", "deviceId") 
             do UPDATE set profile = "${req.body.profile}", type = "${req.body.device}", containerStatus = "CREATING", 
             runningDetails = '${JSON.stringify(run_detail)}', info = '${form_info}', services = '{}';`)

                db.run(`INSERT INTO "containerInfo" ("userId", "containerName", "deviceId", "profile", 
            "type", "containerStatus", "runningDetails", "info", "services") VALUES ("${req.user}",
            "${req.body.containerName}" , "${req.session.deviceName}", "${req.body.profile}", "${req.body.device}",
             "CREATING", '${JSON.stringify(run_detail)}', '${form_info}', '{}') on CONFLICT("containerName", "deviceId") 
             do UPDATE set profile = "${req.body.profile}", type = "${req.body.device}", containerStatus = "CREATING", 
             runningDetails = '${JSON.stringify(run_detail)}', info = '${form_info}', services = '{}';`,
                    function (err) {
                        if (err) {
                            return console.log(err.message);
                        }
                        console.log("entry added to table");
                    });


                console.log(data)
                if (config.containerType == "lxd") {
                    io.to(req.session.deviceName).emit('lxd_containerCreate', data);
                } else {
                    io.to("publisher").emit('configContainer', { data: data });
                }

            }
            res.redirect('/status?numPublisher=' + numPublisher + "&numSubscriber=" + numSubscriber);
        // }
    })

    router.get('/serviceInfo', pass.checkAuthenticated , (req, res) => {
        console.log("--------------------------- req.body  post /configure = " + JSON.stringify(req.body));
        var data = {
            userName: req.body.userName,
            devices: userMap[req.body.userName]
        }

        dbm.userDao.getUserData(req.user, (userData, info, settings) => {
            var data = {
                "userName": req.user,
                "userMap": userData,
                "deviceName": req.session.deviceName,
                "info": info,
                "setting": settings
            }
            res.render('serviceInfo', { data: data });
        })

    })


    router.get('/profile', pass.checkAuthenticated , (req, res) => {
        console.log("get _profile page");
        res.render('__profile', {});
    })

    router.get('/webosHub', pass.checkAuthenticated , (req, res) => {
        console.log("get imageDashboard page");

        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {

            var userData = () => {
                dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                    var data = {
                        "userName": req.user,
                        "userMap": userData,
                        "info": info,
                        "setting": settings
                    }
                    var cb2 = (rows) => {
                        data.userConfiguredImages = rows;

                        console.log("........,,,,,,,,,,,,,,,,,,,,,")
                        console.log(data)
                        // console.log(JSON.stringify(data))
                        res.render('webosHub', { data: data });
                    }

                    var cb = (rows) => {
                        data.images = rows;
                        dbm.imageDao.getUserImageConfigInfo(req.user, cb2)
                    }
                    dbm.imageDao.getImagesInfo(cb)
                })
            }

            if (req.query.closeNotificationImageName != undefined) {
                console.log(`UPDATE imageConfig set displayNotification = 0 WHERE name = "${req.query.closeNotificationImageName}" ;`)
                db.run(`UPDATE imageConfig set displayNotification = 0 WHERE name = "${req.query.closeNotificationImageName}" ;`,
                    function (err) {
                        if (err) {
                            return console.log(err.message);
                        }
                        console.log("entry updated to table");
                        userData();
                    });
            } else {
                userData();
            }

        // }

    })

    router.get('/imageDashboard', pass.checkAuthenticated , (req, res) => {
        console.log("get imageDashboard page");

        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {

            dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "info": info,
                    "setting": settings
                }

                var cb = (rows) => {
                    data.userConfiguredImages = rows;

                    res.render('imageDashboard', { data: data });
                }
                dbm.imageDao.getImagesInfo(cb)

            })
        // }

    })

    router.get('/deviceDashboard', pass.checkAuthenticated , (req, res) => {
        console.log("get deviceDashboard page");

        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
            dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "info": info,
                    "setting": settings
                }

                var cb = (rows) => {
                    data.userConfiguredImages = rows;

                    res.render('deviceDashboard', { data: data });
                }
                dbm.imageDao.getImagesInfo(cb)

            })
        // }
    })

    router.get('/buildDashboard', pass.checkAuthenticated , (req, res) => {
        console.log("get buildDashboard page");

        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
            dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                dbm.buildConfigDao.getbuildServerData((buildConfig) => {
                    console.log(buildConfig)
                    var data = {
                        "userName": req.user,
                        "setting": settings,
                        "buildConfig": buildConfig
                    }
                    res.render('buildDashboard', { data: data });
                })

            })

        // }

    })

    router.get('/deviceInfo', pass.checkAuthenticated , (req, res) => {
        console.log("get deviceInfo page");

        // if (req.user == undefined) {
        //     res.render('login', {});
        // } else {
            dbm.userDao.getUserData(req.user, (userData, info, settings) => {
                var data = {
                    "userName": req.user,
                    "userMap": userData,
                    "deviceName": req.session.deviceName,
                    "info": info,
                    "setting": settings
                }
                // console.log("........,,,,,,,,,,,,,,,,,,,,,")
                // console.log(JSON.stringify(data))
                res.render('deviceInfo', { data: data });
            })

        // }

    })

    router.post('/start_configure', pass.checkAuthenticated , (req, res) => {
        console.log("--------------------------- req.body post /start_configure= " + JSON.stringify(req.body));
        var data = {
            "userName": req.body.userName,
            "deviceName": req.body.deviceName
        }

        res.render('configure', { data: data })
    })


    router.post('/configure', pass.checkAuthenticated , (req, res) => {
        console.log("--------------------------- req.body  post /configure = " + JSON.stringify(req.body));
        var data = {
            userName: req.body.userName,
            devices: userMap[req.body.userName]
        }
        io.to("publisher").emit('configContainer', { data: req.body });

        dbm.userDao.getUserData(req.user, (userData, info, settings) => {
            var data = {
                "userName": req.user,
                "userMap": userData,
                "deviceName": req.session.deviceName,
                "info": info,
                "setting": settings
            }
            // console.log("........,,,,,,,,,,,,,,,,,,,,,")
            // console.log(JSON.stringify(data))
            res.render('profile', { data: data });
        })

        // res.render('profile', { data: data })
    })


    router.post('/profile', pass.checkAuthenticated , (req, res) => {
        console.log("--------------------------- req.body  post /profile = " + JSON.stringify(req.body));
        var data = {
            userName: req.body.userName,
            devices: userMap[req.body.userName]
        }
        console.log("--------------------------- req.body  post /profile out data= " + JSON.stringify(data));

        dbm.userDao.getUserData(req.user, (userData, info, settings) => {
            var data = {
                "userName": req.user,
                "userMap": userData,
                "deviceName": req.session.deviceName,
                "info": info,
                "setting": settings
            }
            //console.log("........,,,,,,,,,,,,,,,,,,,,,")
            //console.log(JSON.stringify(data))
            res.render('profile', { data: data });
        })

        // res.render('profile', { data: data })

    })



    app.use(router);
};

module.exports = routes;
