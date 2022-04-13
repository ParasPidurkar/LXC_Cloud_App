const BuildClientIO = require('./BuildClientIO');
const DeviceClientIO = require('./DeviceClientIO');

let instance = null
let db;
let dbm;
let server;
let LXDRest;
let io;

class SIOManager {

    constructor() {
        console.log("SIOManager constructor")

    }

    async init(server_, dbm_, LXDRest_, io_) {
        console.log("SIOManager init")
        server = server_;
        dbm = dbm_;
        LXDRest = LXDRest_;
        LXDRest.test()
        io = io_;

    }

    async listen() {

        io.on('connection', (socket) => {
            console.log("on connect ")
            dbm.test();
            socket.on('message', function (details) {
                // console.log("Server got new message => " + JSON.stringify(details));
                if (!details && !details.to) return;
                details.from = socket.name || socket.id;
                const subscriber = io.sockets.adapter.rooms.get(details.to);
                const numSubscriber = subscriber ? subscriber.size : 0;
                // console.log("number of device (subscriber)... = " + numSubscriber);


                if (details.cc != undefined) {
                    const ui = io.sockets.adapter.rooms.get(details.cc);
                    const uiSubscriber = ui ? io.size : 0;
                    console.log("number of device (ui)... = " + uiSubscriber);
                    console.log("..............................................")
                    io.to(details.cc).emit('message', details);
                }
                io.to(details.to).emit('message', details);
            });

            socket.on('configServerControl', function (details) {

                switch (details.type) {
                    case "selectContainer":
                        //TODO 
                        //message will come here in case publisher found more then one container for provided search  

                        break;

                    default:
                        console.log("Server got new message => " + JSON.stringify(details));
                        if (!details && !details.to) return;
                        details.from = socket.name || socket.id;
                        const subscriber = io.sockets.adapter.rooms.get(details.to);
                        const numSubscriber = subscriber ? subscriber.size : 0;
                        console.log("number of device (subscriber)... = " + numSubscriber);
                        io.to(details.to).emit('message', details);
                        if (details.cc != undefined) {
                            const ui = io.sockets.adapter.rooms.get(details.cc);
                            const uiSubscriber = ui ? io.size : 0;
                            console.log("number of device (ui)... = " + uiSubscriber);
                            console.log("..............................................")
                            io.to(details.cc).emit('message', details);
                        }

                        break;

                }
            });


            socket.on('update', function (details) {
                var subscriptionClient = io.to(details.to);

                switch (details.type) {
                    case "status":
                        console.log("status ...................... start")
                        // console.log(userMap)
                        console.log(details)

                        var running_info = JSON.stringify(details.data);
                        if (details.data.State == "DELETED") {
                            db.run(`DELETE FROM containerInfo  WHERE containerName = "${details.data.Name}" and deviceId = "${details.from}";`,
                                function (err) {
                                    if (err) {
                                        return console.log(err.message);
                                    }
                                    console.log("entry deleted FROM containerInfo for containerName = " + details.data.Name);
                                });

                        } else {
                            db.run(`UPDATE containerInfo set containerStatus = "${details.data.State}", runningDetails = '${running_info}' WHERE containerName = "${details.data.Name}" and deviceId = "${details.from}";`,
                                function (err) {
                                    if (err) {
                                        return console.log(err.message);
                                    }
                                    console.log("entry added to table");
                                });
                        }

                        console.log("status ...................... end")
                        break;

                    case "download":
                        console.log("download ...................... start")
                        // console.log(userMap)
                        console.log(details)
                        // console.log(JSON.stringify(userMap))
                        console.log(`UPDATE containerInfo set configStatusCode = "${details.statusCode}", configDescription = "${details.status}" WHERE containerName = "${details.containerName}" AND deviceId = "${details.from}";`)
                        db.run(`UPDATE containerInfo set configStatusCode = "${details.statusCode}", configDescription = "${details.status}" WHERE containerName = "${details.containerName}" AND deviceId = "${details.from}";`,
                            function (err) {
                                if (err) {
                                    return console.log(err.message);
                                }
                                console.log("entry added to table");
                            });


                        console.log("download ...................... end")
                        break;

                    case "serviceUpdate":
                        console.log("serviceUpdate ...................... start")
                        db.run(`UPDATE containerInfo SET services = '${JSON.stringify(details.data)}' WHERE containerName = "${details.containerName}" AND deviceId = "${details.from}";`,
                            function (err) {
                                if (err) {
                                    return console.log(err.message);
                                }
                                console.log("containerInfo entry updated to table");
                            });
                        console.log("serviceUpdate ...................... start")
                        break;

                    case "deviceInfo":
                        console.log("deviceInfo ...................... start")

                        db.run(`UPDATE deviceInfo SET deviceInfo = '${JSON.stringify(details.payload)}' WHERE deviceId = '${details.from}'`,
                            function (err) {
                                if (err) {
                                    return console.log(err.message);
                                }
                                console.log("deviceInfo entry updated to table");
                            });

                        console.log("deviceInfo ...................... end")
                        break;



                    case "isServiceAvailableCB":
                        console.log("isServiceAvailableCB ...................... start")
                        SIOManager.sendMessage(details)
                            (details)

                        console.log("isServiceAvailableCB ...................... end")
                        break;

                    case "cleaningCB":
                        console.log("cleaningCB ...................... start")
                        SIOManager.sendMessage(details)
                        SIOManager.updateDB(details)
                        console.log("cleaningCB ...................... end")
                        break;

                    case "downloadNew":
                        console.log("download ...................... start")
                        SIOManager.sendMessage(details)
                        // SIOManager.updateDB(details)
                        console.log("download ...................... end")
                        break;

                    case "downloadCB":
                        console.log("downloadCB ...................... start")
                        SIOManager.sendMessage(details)
                        SIOManager.updateDB(details)
                        console.log("downloadCB ...................... end")
                        break;

                    case "configCB":
                        console.log("configCB ...................... start")
                        SIOManager.sendMessage(details)
                        SIOManager.updateDB(details)
                        console.log("configCB ...................... end")
                        break;

                    case "preStartConfigCB":
                        console.log("preStartConfigCB ...................... start")
                        SIOManager.sendMessage(details)
                        SIOManager.updateDB(details)
                        console.log("preStartConfigCB ...................... end")
                        break;

                    case "startContainerCB":
                        console.log("startContainerCB ...................... start")
                        SIOManager.sendMessage(details)
                        SIOManager.updateDB(details)
                        console.log("startContainerCB ...................... end")
                        break;

                    case "postStartConfigCB":
                        console.log("postStartConfigCB ...................... start")
                        SIOManager.sendMessage(details)
                        SIOManager.updateDB(details)
                        console.log("postStartConfigCB ...................... end")
                        break;


                    default:
                        break;
                }
                if (!subscriptionClient) {
                    details.type = "error";
                    details.description = "Subscription client disconnected please check and retry.";
                    socket.emit('update', details);
                    return;
                }


                // details.from = socket.name || socket.id;
                subscriptionClient.emit('update', details);
            });

            socket.on('createdContainer', function (details) {
                console.log("createdContainer callback")
                console.log(details)
                //socket.emit("message", { payload: { "type": "startContainer", "containerName": details.containerName } })

                // console.log(details)
                socket.emit("message", { payload: { "type": "startContainer", "containerName": details.containerName, "device": details.device } })

                const ui = io.sockets.adapter.rooms.get(details.to);
                const uiSubscriber = ui ? io.size : 0;
                console.log("number of device (ui)... = " + uiSubscriber);
                console.log("..............................................")
                io.to(details.to).emit('message', details);
            });

            // TODO replace it with deviceJoin
            socket.on('join', async function (userName, deviceName, lxdTrustPassword, ip, cb) {
                console.log("....................device Join")
                dbm.test();
                LXDRest.test();
                (await new DeviceClientIO(io, socket, dbm, LXDRest)).init(userName, deviceName, lxdTrustPassword, ip, cb)
                socket.join(deviceName);
                socket.userName = userName;
                socket.deviceName = deviceName;
                socket.room = deviceName;
                socket.ip = ip;
                socket.lxdTrustPassword = lxdTrustPassword;


                socket.broadcast.emit('device-joined', {
                    userName: userName,
                    deviceName: deviceName,
                });
            });

            socket.on('joinFacenetDevice', function (msg) {

                //console.log()
                // console.log("\n enrolling the images ")
                socket.join("FacenetDevice")

            })


            socket.on('disconnect', function () {
                if (socket.userName && socket.room) {
                    console.log("device disconnected ");
                    console.log("socket.userName  = " + socket.userName + ", socket.room = " + socket.room)
                    db.run(`UPDATE "deviceInfo" SET "deviceStatus" = 'disconnected' WHERE deviceId = '${socket.room}' AND userId = '${socket.userName}';`,
                        function (err) {
                            if (err) {
                                return console.log(err.message);
                            }
                            console.log("entry added to table");

                        });

                    db.run(`UPDATE "containerInfo" SET containerStatus = 'disconnected' WHERE deviceId = '${socket.room}' AND  userId = '${socket.userName}'; `,
                        function (err) {
                            if (err) {
                                return console.log(err.message);
                            }
                            console.log("All container disconnected");
                        });



                    // delete userMap[socket.userName][socket.room]
                    socket.broadcast.emit('device-removed', {
                        userName: socket.userName,
                        deviceName: socket.room,
                    });
                }
                if (socket.serverid) {
                    db.run(`UPDATE "buildConfig" SET status = 'disconnected', serverinfo='{}' WHERE serverid = '${socket.serverid}'; `,
                        function (err) {
                            if (err) {
                                return console.log(err.message);
                            }
                            console.log("All Build Server disconnected");
                        });
                    socket.broadcast.emit('server-removed', {
                        config: socket.config,
                    });
                }

            });

            socket.on('configJoin', function (userName) {
                console.log(" Config/UI client joined = " + userName);
                socket.join(userName);
            });

            socket.on('publisherJoin', function (data) {
                console.log(" Publisher joined ");
                socket.join("publisher");
            });

            socket.on('buildJoin', async function (config, cb) {
                console.log(" buildJoin joined ");
                console.log("ip:" + config);
                // (new BuildClientIO(io,socket)).init(config, cb)
                (await new BuildClientIO(io, socket, dbm, LXDRest)).init(config, cb)
            });

            socket.on('imageBuildUpdate', function (message) {
                console.log(" imageBuildUpdate");
                console.log(message)
                io.to(message.userName).emit("imageBuildUIUpdate", message)
                console.log(`UPDATE imageConfig set status = '${message.statusCode}' WHERE name = "${message.imageName}" ;`)
                db.run(`UPDATE imageConfig set status = '${message.statusCode}' WHERE name = "${message.imageName}" ;`,
                    function (err) {
                        if (err) {
                            return console.log(err.message);
                        }
                        console.log("entry updated to table");
                    });
            });

            socket.on('updateImagesOnHub', function (data) {
                console.log("updateImagesOnHub");
                console.log(data)

                db.run(`DELETE FROM  "containerHub";`,
                    function (err) {
                        if (err) {
                            return console.log(err.message);
                        }
                        var values = "";
                        for (const [key, value] of Object.entries(data)) {
                            console.log(`${key}: ${value}`);
                            if (values != "")
                                values += ", "
                            values += `("${key}", "${data[key].properties.architecture}", "${data[key].properties.description}", "${data[key].properties.os}", json('${JSON.stringify(data[key])}'))`
                        }
                        if (values == "")
                            return;
                        db.run(`INSERT INTO containerHub(name, architecture, description, os, detail) VALUES ${values}`,
                            function (err) {
                                if (err) {
                                    return console.log(err.message);
                                }

                                console.log("entry added to table");
                            });
                        console.log("entry added to table");
                    });
            });

        });

    }

    static sendMessage(details) {

        console.log("Server got new message => " + JSON.stringify(details));
        if (!details && !details.to) return;
        // details.from = socket.name || socket.id;
        const subscriber = io.sockets.adapter.rooms.get(details.to);
        const numSubscriber = subscriber ? subscriber.size : 0;
        console.log("number of device (subscriber)... = " + numSubscriber);
        io.to(details.to).emit('message', details);
        if (details.cc != undefined) {
            const ui = io.sockets.adapter.rooms.get(details.cc);
            const uiSubscriber = ui ? io.size : 0;
            console.log("number of device (ui)... = " + uiSubscriber);
            console.log("..............................................")
            io.to(details.cc).emit('message', details);
        }

    }


    static updateDB(details) {
        console.log("updateDB .....................")

        if (details.payload.statusCode < 0) {

            var run_detail = { Name: details.payload.containerName, State: "Failed" };
            console.log(`UPDATE containerInfo set runningDetails = '${JSON.stringify(run_detail)}', containerStatus = "FAILED", configStatusCode = ${details.payload.statusCode}, configDescription = "${details.payload.status}" WHERE containerName = "${details.payload.containerName}" AND deviceId = "${details.from}";`)
            db.run(`UPDATE containerInfo set runningDetails = '${JSON.stringify(run_detail)}', containerStatus = "FAILED", configStatusCode = ${details.payload.statusCode}, configDescription = "${details.payload.status}" WHERE containerName = "${details.payload.containerName}" AND deviceId = "${details.from}";`,
                function (err) {
                    if (err) {
                        return console.log(err.message);
                    }
                    console.log("entry added to table");
                });
        } else {
            console.log(`UPDATE containerInfo set configStatusCode = ${details.payload.statusCode}, configDescription = "${details.payload.status}" WHERE containerName = "${details.payload.containerName}" AND deviceId = "${details.from}";`)
            db.run(`UPDATE containerInfo set configStatusCode = ${details.payload.statusCode}, configDescription = "${details.payload.status}" WHERE containerName = "${details.payload.containerName}" AND deviceId = "${details.from}";`,
                function (err) {
                    if (err) {
                        return console.log(err.message);
                    }
                    console.log("entry added to table");
                });
        }


    }


    static async getInstance(server, dbm, LXDRest, io) {
        if (!instance) {
            console.log("SIOManager getInstance")

            LXDRest.test()
            instance = await new SIOManager()
            await instance.init(server, dbm, LXDRest, io)
            instance.listen()
            db = dbm.db
        }
        return instance
    }
}






function describeRoom(name) {
    var adapter = io.nsps['/'].adapter;
    var clients = adapter.rooms[name] || {};
    var result = {
        clients: {}
    };
    Object.keys(clients).forEach(function (id) {
        result.clients[id] = adapter.nsp.connected[id].resources;
    });
    console.log("describeRoom =>");
    console.log(result);
    return result;
}

function clientsInRoom(name) {
    return io.sockets.clients(name).length;
}

function safeCb(cb) {
    console.log(cb)
    console.log(typeof cb)
    if (typeof cb === 'function') {
        return cb;
    } else {
        console.log("\\\\\\\\\\\\\\\\\\\\\ not a function")
        return function () { };
    }
}

module.exports = SIOManager