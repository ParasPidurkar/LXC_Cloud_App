const config = require('getconfig')

const io = require('socket.io-client')
var requestify = require('requestify');
const { query } = require('express');
const sqlite3 = require('sqlite3').verbose();
var fs = require('fs');





let db;
var availableContainerInfo = [];

requestify.get(`${config.containerHub.protocol}://${config.containerHub.ip}:${config.containerHub.port}/files`)
    .then(function(response) {
        response.getBody();
        availableContainerInfo = JSON.parse(response.body);
        console.log(availableContainerInfo)


        db = new sqlite3.Database('../data/data.db', sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Connected to the data database.');
            publishContainerTemp("speaker")
            publishContainerTemp("camera")
        });
    });





function publishContainerTemp(device) {
    var deviceInfo = { "profile": "surveillance", "microphone": "No", "speaker": "No", "frame": "60 fps", "resolution": "1920" }


    fs.readFile(`../config/${device}/config`, "utf8", (err, data) => {
        console.log(",,,,,,,,,,,,,,,,,,,,,,,,, " + `../config/${device}/config`)
        if (err)
            console.log(err)
        else {
            console.log(data);
            var config = data;

            fs.readFile('../config/cleanOldContainer.sh', "utf8", (err, data) => {
                console.log(",,,,,,,,,,,,,,,,,,,,,,,,,,../config/cleanOldContainer.sh ")
                if (err)
                    console.log(err)
                else {
                    console.log(data);
                    var cleaning = data;

                    fs.readFile('../config/createContainer.sh', "utf8", (err, data) => {
                        console.log(",,,,,,,,,,,,,,,,,,,,,,,,,,../config/createContainer.sh ")
                        if (err)
                            console.log(err)
                        else {
                            console.log(data);
                            var creation = data;

                            fs.readFile(`../config/${device}/preStartConfig.sh`, "utf8", (err, data) => {
                                console.log(",,,,,,,,,,,,,,,,,,,,,,,,,," + `../config/${device}/preStartConfig.sh`)
                                if (err)
                                    console.log(err)
                                else {
                                    console.log(data);
                                    var preStartConfig = data;
                                    fs.readFile(`../config/${device}/postStartConfig.sh`, "utf8", (err, data) => {
                                        console.log(",,,,,,,,,,,,,,,,,,,,,,,,,," + `../config/${device}/postStartConfig.sh`)
                                        if (err)
                                            console.log(err)
                                        else {
                                            console.log(data);
                                            var postStartConfig = data;

                                            var dependentService = ["lxc", "lxc-net"]
                                            var dependentDevice = `test7`
                                            var expectedFileName = "webos_armhf_" + device + "_rootfs.tar.bz2";
                                            console.log("searching for " + expectedFileName)

                                            var found = availableContainerInfo.find(function(item) { return item.name === expectedFileName; });
                                            console.log("findMyContainer found = ");
                                            console.log(found);
                                            if (found != undefined) {
                                                publishContainer(device, deviceInfo, config, cleaning,
                                                    creation, preStartConfig, postStartConfig, dependentService, dependentDevice, found)
                                            }
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    })

    // var config = `test1`
    // var cleaning = `test2`
    // var creation = `test3`
    // var preStartConfig = `test4`
    // var postStartConfig = `test5`
}




// device => string
// deviceInfo => JSON => Note: will be used for searching container 
// config => config file for container 
// cleaning =>  shell script code  
// creation =>  shell script code
// preStartConfig =>  shell script code
// postStartConfig => shell script code
// dependentService => shell script code
// dependentDevice => array of string
// url => url of model file to download

function publishContainer(device, deviceInfo, config, cleaning,
    creation, preStartConfig, postStartConfig, dependentService, dependentDevice, url) {


    console.log(`INSERT INTO "containerConfig" ("device", "deviceInfo", "config", "cleaning", 
    "creation", "preStartConfig", "postStartConfig", "dependentService", "dependentDevice", "url")
    VALUES('${device}', json('${JSON.stringify(deviceInfo)}'), '${config}', '${cleaning}', '${creation}',
    '${preStartConfig}', '${postStartConfig}', '${JSON.stringify(dependentService)}', '${dependentDevice}','${JSON.stringify(url)}');`)

    db.run(`INSERT INTO "containerConfig" ("device", "deviceInfo", "config", "cleaning", 
    "creation", "preStartConfig", "postStartConfig", "dependentService", "dependentDevice", "url")
    VALUES("${device}", json('${JSON.stringify(deviceInfo)}'), '${config}', '${cleaning}', '${creation}',
    '${preStartConfig}', '${postStartConfig}', '${JSON.stringify(dependentService)}', '${dependentDevice}','${JSON.stringify(url)}')
    
    ON CONFLICT("device","deviceInfo") DO UPDATE SET 
    "device"='${device}', "deviceInfo"=json('${JSON.stringify(deviceInfo)}'), "config"='${config}', "cleaning"='${cleaning}', 
    "creation"='${creation}', "preStartConfig"='${preStartConfig}', "postStartConfig"='${postStartConfig}', 
    "dependentService"='${JSON.stringify(dependentService)}', "dependentDevice"='${dependentDevice}', "url"='${JSON.stringify(url)}'
    ;`,
        (err) => {
            if (err) {
                console.error(err.message);
            }
            console.log("-----publishContainer-------");

        });
}


let socketURL = `${config.containerHub.protocol}://${config.containerHub.ip}:${config.server.port}`


const socketOptions = {
    transports: ['websocket'],
    'force new connection': true,
    secure: config.server.secure,
}

const client = io.connect(socketURL, socketOptions)

client.on('connect', () => {
    console.log("Publisher connected")
    client.emit('publisherJoin', {})
})

client.on('configContainer', message => {
    console.log(`configContainer : ${JSON.stringify(message)}`)
        // findMyContainer(message.data.deviceName, message.data.os, message.data.architecture, message.data.module);
        // function findMyContainer2(userName, deviceName, containerName, device) 
    var searchData = JSON.parse(JSON.stringify(message.data.formData))
    delete searchData.containerName;
    delete searchData.device;
    console.log(`searchData : ${JSON.stringify(searchData)}`)
    if (config.configServerControl) {
        findMyContainer3(message.data.userName, message.data.deviceName, message.data.formData.containerName, message.data.formData.device, searchData)
    } else
        findMyContainer2(message.data.userName, message.data.deviceName, message.data.formData.containerName, message.data.formData.device, searchData)
})



client.on('remove', message => {
    console.log(`removed : ${JSON.stringify(message)}`)
})

client.on('joined', message => {
    console.log(`joined : ${JSON.stringify(message)}`)
})
client.on('presence', message => {
    console.log(`presence :${JSON.stringify(message)}`)
})




function findMyContainer3(userName, deviceName, containerName, device, searchData) {
    console.log("findMyContainer3")

    var query = `SELECT * FROM containerConfig WHERE device = "${device}" `

    Object.keys(searchData).forEach((item) => {
        query += `AND json_extract(deviceInfo, '$.${item}') ="${searchData[item]}" `
    });
    console.log(query)
    var rows = [];

    db.each(query, (err, row) => {
            if (err) {
                console.error(err.message);
            }
            rows.push(row);
        },
        (err, numberOfRows) => {
            console.log("-----select -------");
            console.log(rows)
            if (err) {
                console.error(err.message);
                data = { error: "Error during container search !!!" };
                client.emit('message', {
                    to: deviceName,
                    type: "error",
                    payload: { type: "error", "description": "Error during container search !!!" }
                })
                return;
            }
            console.log(`There were ${numberOfRows} containers`);
            if (numberOfRows == 0) {
                data = { error: "device not match." };
                client.emit('message', {
                    to: deviceName,
                    type: "error",
                    payload: { type: "error", "description": "Not able find the image on container hub according to provided configuration. " }
                })
            } else if (numberOfRows == 1) {
                console.log("rows[0].url")
                console.log(rows[0].url)
                client.emit('message', {
                    to: deviceName,
                    cc: userName,
                    type: "isServiceAvailable",
                    payload: {
                        "id": rows[0].id,
                        "type": "isServiceAvailable",
                        "name": containerName,
                        "device": device,
                        "userName": userName,
                        "dependentServiceArr": JSON.parse(rows[0].dependentService)
                    }
                })
            } else if (numberOfRows > 1) {
                client.emit('configServerControl', {
                    to: deviceName,
                    cc: userName,
                    type: "selectContainer",
                    payload: { "type": "selectContainer", "name": containerName, "containers": rows, "device": device, "userName": userName }
                })
            }

        }
    );

}




function findMyContainer2(userName, deviceName, containerName, device, searchData) {

    var query = `SELECT * FROM containerConfig WHERE device = "${device}" `

    Object.keys(searchData).forEach((item) => {
        query += `AND json_extract(deviceInfo, '$.${item}') ="${searchData[item]}" `
    });
    console.log(query)
    var rows = [];



    db.each(query, (err, row) => {
            if (err) {
                console.error(err.message);
            }
            //console.log(row.userId);

            // console.log(row);
            rows.push(row);

        },
        (err, numberOfRows) => {
            console.log("-----select -------");
            console.log(rows)
            if (err) {
                console.error(err.message);
                data = { error: "Error during container search !!!" };
                client.emit('message', {
                    to: deviceName,
                    type: "error",
                    payload: { type: "error", "description": "Error during container search !!!" }
                })
                return;
            }
            console.log(`There were ${numberOfRows} containers`);
            if (numberOfRows == 0) {
                data = { error: "device not match." };
                client.emit('message', {
                    to: deviceName,
                    type: "error",
                    payload: { type: "error", "description": "Not able find the image on container hub according to provided configuration. " }
                })
            } else if (numberOfRows == 1) {
                console.log("rows[0].url")
                console.log(rows[0].url)
                client.emit('message', {
                    to: deviceName,
                    cc: userName,
                    type: "download",
                    payload: { "type": "download", "name": containerName, "downloadInfo": JSON.parse(rows[0].url), "device": device }
                })
            } else if (numberOfRows > 1) {
                client.emit('message', {
                    to: deviceName,
                    cc: userName,
                    type: "download",
                    payload: { "type": "select", "name": containerName, "downloadInfo": rows, "device": device }
                })
            }

        }
    );
}




function findMyContainer(deviceName, os, architecture, module) {
    var expectedFileName = os + "_" + architecture + "_" + module + "_rootfs.tar.bz2";
    console.log("expectedFileName = " + expectedFileName)
    var found = availableContainerInfo.find(function(item) { return item.name === expectedFileName; });
    console.log("findMyContainer found = ");
    console.log(found);
    if (found != undefined) {
        client.emit('message', {
            to: deviceName,
            payload: { "type": "download", "name": module, "downloadInfo": found }
        })
    } else {
        client.emit('message', {
            to: deviceName,
            payload: { "type": "error", "description": "Not able find the image on container hub according to provided configuration. " }
        })
    }
}


function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max))
}


let rooms = ["500"]


function fun_download() {
    client.emit('message', {
        to: rooms[getRandomInt(rooms.length)],
        payload: { "type": "download", "container": "container-image.tar.bz2", "server": "10.221.59.59", "Port": "8080", "name": "webos_test" }
    })
}


function fun_start() {
    console.log('Starting Container in 10 seconds');
    client.emit('message', {
        to: rooms[getRandomInt(rooms.length)],
        payload: { "type": "command", "name": "webos_test", "command": "start" }
    })
}


function fun_stop() {
    console.log('Stopping Container in 10 seconds');
    client.emit('message', {
        to: rooms[getRandomInt(rooms.length)],
        payload: { "type": "command", "name": "webos_test", "command": "stop" }
    })
}




function isServiceAvailableCB(message) {
    console.log('function isServiceAvailableCB');
    console.log(message)
        //next do cleaning
    var query = `SELECT id, cleaning, url, device FROM containerConfig WHERE  id = ${message.payload.id} `
    console.log(query)
    if (message.returnValue) {
        db.each(query, (err, row) => {
            if (err) {
                console.error(err.message);
                client.emit('message', {
                    to: message.from,
                    cc: message.cc,
                    type: "error",
                    payload: {
                        type: "error",
                        "description": "Error during container search !!!",
                        "containerName": message.payload.containerName
                    }
                })
            }
            console.log(row)

            client.emit('message', {
                to: message.from,
                cc: message.cc,
                type: "cleaning",
                payload: {
                    "id": row.id,
                    "type": "cleaning",
                    "containerName": message.payload.containerName,
                    "device": message.from,
                    "userName": message.cc,
                    "cleaningScript": row.cleaning,
                    "url": JSON.parse(row.url).url,
                    "deviceType": row.device
                }
            })
        });
    } else {
        console.log("isServiceAvailableCB returned false; You don't have dependent services installed !!!")
    }
}

//TODO need to include this step 
function isDeviceAvailableCB(message) {
    console.log('function isDeviceAvailableCB');
    console.log(messages)
    var query = `SELECT dependentService FROM containerConfig WHERE ID = ${message.id} `
    console.log(query)

    db.each(query, (err, row) => {
        if (err) {
            console.error(err.message);
            client.emit('message', {
                to: deviceName,
                type: "error",
                payload: {
                    type: "error",
                    "description": "Error during container search !!!",
                    "containerName": message.payload.containerName
                }
            })
        }
        console.log(row)

        // client.emit('message', {
        //     to: deviceName,
        //     cc: userName,
        //     type: "download",
        //     payload: { "type": "download", "name": containerName, "downloadInfo": JSON.parse(rows[0].url), "device": device }
        // })
    });
}

function cleaningCB(message) {
    console.log('function cleaningCB');
    console.log(message)
        //start to download
    var query = `SELECT id, url, device FROM containerConfig WHERE  id = ${message.payload.id} `
    console.log(query)
    if (message.returnValue) {
        db.each(query, (err, row) => {
            if (err) {
                console.error(err.message);
                client.emit('message', {
                    to: message.from,
                    cc: message.cc,
                    type: "error",
                    payload: { type: "error", "description": "Error during container search !!!" },
                    "containerName": message.payload.containerName
                })
            }
            console.log(row)

            client.emit('message', {
                to: message.from,
                cc: message.cc,
                type: "downloadNew",
                payload: {
                    "id": row.id,
                    "type": "downloadNew",
                    "containerName": message.payload.containerName,
                    "device": message.from,
                    "userName": message.cc,
                    "url": JSON.parse(row.url).url,
                    "deviceType": row.device
                }
            })
        });
    } else {
        console.log("cleaningCB returned false !!!")
    }
}

function downloadCB(message) {
    console.log('function downloadCB');
    console.log(message)
        //start to creat
    var query = `SELECT id, creation, url, device, config FROM containerConfig WHERE  id = ${message.payload.id} `
    console.log(query)
    if (message.returnValue) {
        db.each(query, (err, row) => {
            if (err) {
                console.error(err.message);
                client.emit('message', {
                    to: message.from,
                    cc: message.cc,
                    type: "error",
                    payload: {
                        type: "error",
                        "description": "Error during container search !!!",
                        "containerName": message.payload.containerName
                    }
                })
            }
            console.log(row)

            client.emit('message', {
                to: message.from,
                cc: message.cc,
                type: "config",
                payload: {
                    "id": row.id,
                    "type": "config",
                    "containerName": message.payload.containerName,
                    "device": message.from,
                    "userName": message.cc,
                    "creationScript": row.creation,
                    "configFile": row.config,
                    "url": JSON.parse(row.url).url,
                    "deviceType": row.device
                }
            })
        });
    } else {
        console.log("downloadCB returned false !!!")
    }
}

function configCB(message) {
    console.log('function configCB');
    console.log(message)
        //start to preStartConfig
    var query = `SELECT id, preStartConfig, url, device FROM containerConfig WHERE  id = ${message.payload.id} `
    console.log(query)
    if (message.returnValue) {
        db.each(query, (err, row) => {
            if (err) {
                console.error(err.message);
                client.emit('message', {
                    to: message.from,
                    cc: message.cc,
                    type: "error",
                    payload: { type: "error", "description": "Error during container search !!!" }
                })
            }
            console.log(row)

            client.emit('message', {
                to: message.from,
                cc: message.cc,
                type: "preStartConfig",
                payload: {
                    "id": row.id,
                    "type": "preStartConfig",
                    "containerName": message.payload.containerName,
                    "device": message.from,
                    "userName": message.cc,
                    "preStartConfigScript": row.preStartConfig,
                    "url": JSON.parse(row.url).url,
                    "deviceType": row.device
                }
            })
        });
    } else {
        console.log("configCB returned false !!!")
    }
}

function preStartConfigCB(message) {
    console.log('function preStartConfigCB');
    console.log(message)
        //proceed to startContainer
    if (message.returnValue) {
        client.emit('message', {
            to: message.from,
            cc: message.cc,
            type: "startContainerNew",
            payload: {
                "id": message.payload.id,
                "type": "startContainerNew",
                "containerName": message.payload.containerName,
                "device": message.from,
                "userName": message.cc
            }
        })
    } else {
        console.log("preStartConfigCB returned false !!!")
    }
}

function startContainerCB(message) {
    console.log('function startContainerCB');
    console.log(message)
        //proceed to postStartConfig 
    var query = `SELECT postStartConfig, id, device FROM containerConfig WHERE id = ${message.payload.id} `
    console.log(query)
    if (message.returnValue) {
        db.each(query, (err, row) => {
            if (err) {
                console.error(err.message);
                client.emit('message', {
                    to: message.from,
                    type: "error",
                    payload: { type: "error", "description": "Error during container search !!!" }
                })
            }
            console.log(row)

            client.emit('message', {
                to: message.from,
                cc: message.cc,
                type: "postStartConfig",
                payload: {
                    "id": row.id,
                    "type": "postStartConfig",
                    "containerName": message.payload.containerName,
                    "device": message.from,
                    "userName": message.cc,
                    "postStartConfigScript": row.postStartConfig,
                    "deviceType": row.device
                }
            })
        });
    } else {
        console.log("startContainerCB returned false !!!")
    }

}

function postStartConfigCB(message) {
    console.log('function postStartConfigCB');
    console.log(message)
    console.log(query)
    if (message.returnValue) {
        console.log("All done !!!")
    } else {
        console.log("postStartConfigCB returned false !!!")
    }
}




client.on('message', message => {
    console.log(message);
    switch (message.type) {

        case "isServiceAvailableCB":
            console.log('type isServiceAvailableCB');
            isServiceAvailableCB(message)

            break;

        case "isDeviceAvailableCB":
            console.log('type isDeviceAvailable');
            break;

        case "cleaningCB":
            console.log('type cleaning');
            cleaningCB(message)
            break;

        case "downloadCB":
            console.log('type download');
            downloadCB(message)
            break;

        case "configCB":
            console.log('type config');
            configCB(message)
            break;

        case "preStartConfigCB":
            console.log('type preStartConfig');
            preStartConfigCB(message)
            break;

        case 'startContainerCB':
            console.log('type startContainer');
            startContainerCB(message)
            break;

        case "postStartConfigCB":
            console.log('type postStartConfig');
            postStartConfigCB(message)
            break;


        default:
            break;
    }

})















//old dump

// function publishCameraContainerTemp() {

//     var device = "camera"

//     var deviceInfo = { profile: 'surveillance', microphone: 'No', speaker: 'No', frame: '60 fps', resolution: '1920' }
//     var config = `test1`
//     var cleaning = `test2`
//     var creation = `test3`
//     var preStartConfig = `test4`
//     var postStartConfig = `test5`
//     var dependentService = `test6`
//     var dependentDevice = `test7`

//     var expectedFileName = "webos_armhf_" + device + "_rootfs.tar.bz2";

//     var found = availableContainerInfo.find(function(item) { return item.name === expectedFileName; });
//     console.log("findMyContainer found = ");
//     console.log(found);
//     if (found != undefined) {
//         publishContainer(device, deviceInfo, config, cleaning,
//             creation, preStartConfig, postStartConfig, dependentService, dependentDevice, found)
//     }
// }




// old search 
/*
var expectedFileName = "webos_armhf_" + device + "_rootfs.tar.bz2";
console.log("expectedFileName = " + expectedFileName)
var found = availableContainerInfo.find(function(item) { return item.name === expectedFileName; });
console.log("findMyContainer found = ");
console.log(found);
if (found != undefined) {
    client.emit('message', {
        to: deviceName,
        cc: userName,
        type: "download",
        payload: { "type": "download", "name": containerName, "downloadInfo": found, "device": device }
    })
} else {
    client.emit('message', {
        to: deviceName,
        type: "error",
        payload: { type: "error", "description": "Not able find the image on container hub according to provided configuration. " }
    })
}
*/






// function isServiceAvailable(message) {
//     console.log('function isServiceAvailable');
//     console.log(message)
//     var query = `SELECT dependentService FROM containerConfig WHERE ID = ${message.id} `
//     console.log(query)

//     db.each(query, (err, row) => {
//         if (err) {
//             console.error(err.message);
//             client.emit('message', {
//                 to: deviceName,
//                 type: "error",
//                 payload: { type: "error", "description": "Error during container search !!!" }
//             })
//         }
//         console.log(row)

//         client.emit('configServerControl', {
//             to: message.deviceName,
//             cc: message.userName,
//             type: "isServiceAvailable",
//             payload: { "name": message.containerName, "device": message.device, "dependentService": JSON.parse(rows[0].url) }
//         })
//     });

// }
// // isServiceAvailable({ id: 22 })