const config = require('getconfig')
let client;
const child_process = require('child_process');
const { spawn } = require('child_process');
const { number } = require('getconfig/types');

function setIOClient(client_) {
    client = client_;
}



function downloadContainer_c(message) {
    console.log("Url = " + message.payload.downloadInfo.url);
    var url = message.payload.downloadInfo.url;



    const clean = spawn('../../config/cleanOldContainer.sh', ["-d", message.payload.downloadInfo.url, "-n", message.payload.name, "-a", "linux32"]);


    clean.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        client.emit('update', {
            data: data,
            to: config.userName,
            from: config.deviceName
        })
    });

    clean.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        client.emit('update', {
            data: data,
            to: config.userName,
            from: config.deviceName
        })
    });

    clean.on('close', (code) => {
        console.log(`clean child process exited with code ${code}`);

        client.emit('update', {
            // data: data,
            to: config.userName,
            from: config.deviceName,
            type: "download",
            statusCode: 1,
            containerName: message.payload.name,
            status: `clean child process exited with code ${code}`,
            description: "Image clean successful."

        })
        if (code == 0) {
            const wget = spawn('wget', [url]);
            wget.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);

            });

            wget.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);

                client.emit('update', {
                    data: data.toString(),
                    to: config.userName,
                    from: config.deviceName,
                    type: "download",
                    statusCode: 1.5,
                    containerName: message.payload.name,
                    status: `Connected and downloading`,
                    description: "Image is getting downloaded."
                })
            });

            wget.on('close', (code) => {

                console.log(`wget child process exited with code ${code}`);
                if (code == 0) {
                    client.emit('update', {
                        // data: data,
                        to: config.userName,
                        from: config.deviceName,
                        type: "download",
                        statusCode: 2,
                        containerName: message.payload.name,
                        status: `wget child process exited with code ${code}`,
                        description: "Image successfully downloaded."
                    })

                    var randomMac = require('random-mac');
                    var mac = randomMac()
                    console.log(mac)
                    const create = spawn('../../config/createContainer.sh', ["-d", message.payload.downloadInfo.url, "-n", message.payload.name, "-a", "linux32", "-t", message.payload.device, "-m", mac]);

                    create.stdout.on('data', (data) => {
                        // console.log(`stdout: ${data}`);
                    });

                    create.stderr.on('data', (data) => {
                        console.error(`stderr: ${data}`);
                        client.emit('update', {
                            data: data,
                            type: "download",
                            containerName: message.payload.name,
                            to: config.userName,
                            from: config.deviceName
                        })
                    });

                    create.on('close', (code) => {
                        console.log(`create child process exited with code ${code}`);
                        if (code == 0) {

                            client.emit('update', {
                                // data: data,
                                to: config.userName,
                                from: config.deviceName,
                                type: "download",
                                statusCode: 3,
                                containerName: message.payload.name,
                                status: `create child process exited with code ${code}`,
                                description: "Image created and ready to configure."
                            })

                            const preStartConfig = spawn(`../../config/${message.payload.device}/preStartConfig.sh`, []);

                            preStartConfig.stdout.on('data', (data) => {
                                // console.log(`stdout: ${data}`);
                            });

                            preStartConfig.stderr.on('data', (data) => {
                                console.error(`stderr: ${data}`);
                                client.emit('update', {
                                    data: data,
                                    type: "download",
                                    containerName: message.payload.name,
                                    to: config.userName,
                                    from: config.deviceName
                                })
                            });

                            preStartConfig.on('close', (code) => {

                                if (code == 0) {
                                    console.log(`preStartConfig child process exited with code ${code}`);
                                    client.emit('update', {
                                        // data: data,
                                        to: config.userName,
                                        from: config.deviceName,
                                        type: "download",
                                        statusCode: 3.5,
                                        containerName: message.payload.name,
                                        status: `preStartConfig child process exited with code ${code}`,
                                        description: "Image created and pre start configuration done; ready to start."
                                    })
                                    client.emit('createdContainer', {
                                        to: config.userName,
                                        from: config.deviceName,
                                        returnValue: true,
                                        containerName: message.payload.name,
                                        device: message.payload.device,
                                        status: `create child process exited with code ${code}`,
                                        description: "Image created and ready to start."
                                    })
                                } else {
                                    client.emit('update', {
                                        // data: data,
                                        to: config.userName,
                                        from: config.deviceName,
                                        type: "download",
                                        statusCode: -3.5,
                                        containerName: message.payload.name,
                                        status: `preStartConfig child process exited with code ${code}`,
                                        description: "Image created and pre start configuration done; ready to start."
                                    })
                                }
                            });

                        } else {
                            client.emit('update', {
                                // data: data,
                                to: config.userName,
                                from: config.deviceName,
                                type: "download",
                                statusCode: -3,
                                containerName: message.payload.name,
                                status: `create child process exited with code ${code}`,
                                description: "Image created and ready to configure."
                            })
                        }

                    });
                } else {
                    client.emit('update', {
                        // data: data,
                        to: config.userName,
                        from: config.deviceName,
                        type: "download",
                        statusCode: -2,
                        containerName: message.payload.name,
                        status: `wget child process exited with code ${code}`,
                        description: "Image successfully downloaded."
                    })
                }
            });
        }

    });
}

function ContainerOperator(message) {
    console.log(message.payload.name, message.payload.command);
    var cmd = '/usr/sbin/kettle -n ' + message.payload.name + ' -c ' + message.payload.command;
    console.log(cmd);
    require('child_process').exec(cmd, function(err, stdout, stderr) {
        if (err) {
            console.log('exec error: ' + error);
        }
    });
}


function getContainerList(cb) {


    const lxcLs = spawn('lxc-ls', []);


    lxcLs.stdout.on('data', (data) => {
        var devLits = []
            // console.log(`stdout: ${data}`);
        data = data.toString('utf8');
        data = JSON.stringify(data);
        data = data.replace(/"| /g, "");
        data = data.split("\\n");
        for (var i = 0; i < data.length - 1; ++i) {
            devLits.push(data[i])
        }
        cb(devLits)
    });

    lxcLs.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);

    });

    lxcLs.on('close', (code) => {
        console.log(`lxcLs child process exited with code ${code}`);

    });

};





function getServiceStatus_backup2(contName) {

    var journalctl = spawn('lxc-attach', ["-n", contName, "--", "journalctl", "-f"]);

    var grep = spawn('grep', ['error']);
    // journalctl.stdout.pipe(grep.stdin);

    journalctl.stdout.on('data', (data) => {

        const buf = new Buffer(4096 - data.toString().length);

        buf.fill('errorTest\n ')
        console.log("vvvvvvvvvvvvvvvvvvvvvvvvvvvvvv " + buf.toString().length)

        var buffer3 = Buffer.concat([data, buf]);

        // Buffer(buffer3).fill(0)
        console.log("vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv " + buffer3.toString().length)
        console.log(buffer3)

        console.log("journalctl .............................................. start " + data.toString().length)
        console.log(data.toString());
        console.log(data)
        console.log("journalctl .............................................. end")
        console.log("******************************************** " + grep);

        grep.stdin.write(buffer3);
    });


    grep.stdout.on('data', (data) => {


        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   grep start " + data.toString().length)
        console.log(data.toString());
        console.log(data);


        var info = data.toString('utf8');
        console.log(info)

        info = info.split("\n");
        var ans = {}
        for (var i = 0; i < info.length - 1; ++i) {
            if (info[i].includes("errorTest") || info[i].length < 10) { continue }
            info[i] = info[i].replace(/  +/g, ' ');
            // console.log(info)
            var temp = info[i].split(" ")
            temp[4] = temp[4].split("[")[0]
            if (!ans.hasOwnProperty(temp[4]))
                ans[temp[4]] = []


            var temp2 = info[i].split(" ", 3).join(" ").length;
            temp2 = info[i].substring(0, temp2)

            var temp3 = info[i].split(" ", 5).join(" ").length;
            temp3 = info[i].substring(temp3 + 1, info[i].length)
            ans[temp[4]].push(temp2 + " : " + temp3)
        }
        console.log(ans)

        client.emit('update', {
            to: config.userName,
            from: config.deviceName,
            type: "serviceUpdate",
            data: ans,
            containerName: contName
        })



        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   grep end")

    });

    grep.stderr.on('data', (data) => {
        console.log(`grep stderr: ${data}`);
    });

    grep.on('close', (code) => {
        if (code !== 0) {
            console.log(`grep process exited with code ${code}`);
        }
    });
}




function getServiceStatus(contName) {

    //journalctl|grep error

    const journalctl = spawn('lxc-attach', ["-n", contName, "--", "journalctl"]);
    const journalctl2 = spawn('lxc-attach', ["-n", contName, "--", "journalctl", "-f"]);


    journalctl.stdout.on('data', (data) => {
        // console.log(`journalctl stdout: ${data}`);
        console.log(data.toString());

        var info = data.toString('utf8');
        info = info.split("\n");

        var ans = {}
        for (var i = 0; i < info.length - 1; ++i) {
            if (!info[i].includes("error") || info[i].length < 10) { continue }
            info[i] = info[i].replace(/  +/g, ' ');
            var temp = info[i].split(" ")
            temp[4] = temp[4].split("[")[0]
            if (!ans.hasOwnProperty(temp[4]))
                ans[temp[4]] = []


            var temp2 = info[i].split(" ", 3).join(" ").length;
            temp2 = info[i].substring(0, temp2)

            var temp3 = info[i].split(" ", 5).join(" ").length;
            temp3 = info[i].substring(temp3 + 1, info[i].length)
            ans[temp[4]].push(temp2 + " : " + temp3)
        }
        console.log(ans)

        client.emit('update', {
            to: config.userName,
            from: config.deviceName,
            type: "serviceUpdate",
            data: ans,
            containerName: contName
        })


    });

    journalctl2.stdout.on('data', (data) => {
        // console.log(`journalctl stdout: ${data}`);
        console.log(data.toString());

        var info = data.toString('utf8');
        info = info.split("\n");

        var ans = {}
        for (var i = 0; i < info.length - 1; ++i) {
            if (!info[i].includes("error") || info[i].length < 10) { continue }
            info[i] = info[i].replace(/  +/g, ' ');
            var temp = info[i].split(" ")
            temp[4] = temp[4].split("[")[0]
            if (!ans.hasOwnProperty(temp[4]))
                ans[temp[4]] = []


            var temp2 = info[i].split(" ", 3).join(" ").length;
            temp2 = info[i].substring(0, temp2)

            var temp3 = info[i].split(" ", 5).join(" ").length;
            temp3 = info[i].substring(temp3 + 1, info[i].length)
            ans[temp[4]].push(temp2 + " : " + temp3)
        }
        console.log(ans)

        client.emit('update', {
            to: config.userName,
            from: config.deviceName,
            type: "serviceUpdate",
            data: ans,
            containerName: contName
        })


    });

    journalctl.stderr.on('data', (data) => {
        console.log(`journalctl stderr: ${data}`);
    });

    journalctl.on('close', (code) => {
        if (code !== 0) {
            console.log(`journalctl process exited with code ${code}`);
        }
    });

}





function getServiceStatus_backup(contName) {

    //journalctl|grep error


    const journalctl = spawn('lxc-attach', ["-n", contName, "--", "journalctl"]);
    const grep = spawn('grep', ['error']);

    journalctl.stdout.on('data', (data) => {
        // console.log(`journalctl stdout: ${data}`);

        grep.stdin.write(data);
    });


    journalctl.stderr.on('data', (data) => {
        console.log(`journalctl stderr: ${data}`);
    });

    journalctl.on('close', (code) => {
        if (code !== 0) {
            console.log(`journalctl process exited with code ${code}`);
        }
        grep.stdin.end();
    });

    grep.stdout.on('data', (data) => {
        console.log(data.toString());

        var info = data.toString('utf8');
        info = info.split("\n");
        var ans = {}
        for (var i = 0; i < info.length - 1; ++i) {
            info[i] = info[i].replace(/  +/g, ' ');
            // console.log(info)
            var temp = info[i].split(" ")
            temp[4] = temp[4].split("[")[0]
            if (!ans.hasOwnProperty(temp[4]))
                ans[temp[4]] = []


            var temp2 = info[i].split(" ", 3).join(" ").length;
            temp2 = info[i].substring(0, temp2)

            var temp3 = info[i].split(" ", 5).join(" ").length;
            temp3 = info[i].substring(temp3 + 1, info[i].length)
            ans[temp[4]].push(temp2 + " : " + temp3)
        }
        console.log(ans)

        client.emit('update', {
            to: config.userName,
            from: config.deviceName,
            type: "serviceUpdate",
            data: ans,
            containerName: contName
        })

    });

    grep.stderr.on('data', (data) => {
        console.log(`grep stderr: ${data}`);
    });

    grep.on('close', (code) => {
        if (code !== 0) {
            console.log(`grep process exited with code ${code}`);
        }
    });
}

function getContainerStatus(contName, cb) {


    const lxcInfo = spawn('lxc-info', ["-n", contName]);

    var info = ""
    lxcInfo.stdout.on('data', (data) => {
        // console.log(`lxcInfo stdout: ${data}`);
        data = data.toString('utf8');
        // console.log("data1 type = " + typeof(data))
        info = info + data;
    });

    lxcInfo.stderr.on('data', (data) => {
        console.error(`lxcInfo stderr: ${data}`);

    });

    lxcInfo.on('close', (code) => {
        console.log(`lxcInfo child process exited with code ${code}`);

        var ans = {}
        if (code) {
            ans.State = "DELETED";
            ans.Name = contName;
            cb(contName, ans);
        } else {

            info = info.replace(/"| /g, "");
            info = info.split("\n");
            console.log(".......................................")
            console.log(info)
            console.log(".......................................")

            for (var i = 0; i < info.length - 1; ++i) {
                var temp = info[i].split(":");

                ans[temp[0]] = temp[1];
            }

            cb(contName, ans);
        }
    });

}

function getContainerStatusCb(contName, data) {
    console.log("getContainerStatusCb => container name = " + contName + " data = " + data);
    console.log(data)
    if (data.State == "RUNNING")
        getServiceStatus(contName)
    console.log("getContainerStatusCb => container name = " + contName + " stat = " + data.State);
    client.emit('update', {
        to: config.userName,
        from: config.deviceName,
        type: "status",
        data: data,
        state: data.State
    })
}



function getStatusOfAllContainerCb(contArr) {
    console.log("getStatusOfAllContainerCb =>")
    console.log(contArr)
    for (var i = 0; i < contArr.length; ++i) {
        getContainerStatus(contArr[i], getContainerStatusCb);
    }
}

function getStatusOfAllContainer_c() {
    getContainerList(getStatusOfAllContainerCb);
}


function getStatusOfContainers_c(message) {
    console.log("\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ getStatusOfContainers_c")
    console.log(message)
    for (var i = 0; i < message.payload.contArr.length; ++i) {
        getContainerStatus(message.payload.contArr[i]["containerName"], getContainerStatusCb);
    }
}


function deleteExistingContainer_c(data) {



    var lxcDestroyFun = (data) => {
        var lxcDestroy;
        if (config.containerType == "lxd") {

            lxcDestroy = spawn('lxc', ["delete", data.payload.containerName, "--force"]);
        } else {
            lxcDestroy = spawn('lxc-destroy', ["-n", data.payload.containerName]);
        }
        lxcDestroy.stdout.on('data', (data) => {
            console.log(`lxcDestroy stdout: ${data}`);
        });

        lxcDestroy.stderr.on('data', (data) => {
            console.error(`lxcDestroy stderr: ${data}`);

        });

        lxcDestroy.on('close', (code) => {
            console.log(` deleteExistingContainer lxcDestroy child process exited with code ${code}`);
            //getContainerStatus(data.payload.containerName, getContainerStatusCb);
            client.emit('deleteExistingContainer', {
                to: config.userName,
                from: config.deviceName,
                type: "deleteExistingContainer",
                containerName: data.payload.containerName,
                status: `lxcDestroy child process exited with code ${code}`,
                returnValue: code
            })
        });

    }


    const lxcStop = spawn('lxc-stop', ["-n", data.payload.containerName]);
    lxcStop.stdout.on('data', (data) => {
        console.log(`lxcStop stdout: ${data}`);
    });

    lxcStop.stderr.on('data', (data) => {
        console.error(`lxcStop stderr: ${data}`);
        // lxcDestroyFun(data)

    });

    lxcStop.on('close', (code) => {
        console.log(` deleteExistingContainer lxcStop child process exited with code ${code}`);
        lxcDestroyFun(data);

    });

}


function deviceInfo_c() {

    console.log("updating deviceInfo")
    const si = require('systeminformation');
    var devInfo = {}

    si.cpu()
        .then(data => {
            // console.log(`cpu`)
            // console.log(data)
            devInfo.cpu = data;

            si.cpuTemperature()
                .then(data => {
                    // console.log(`cpuTemperature`)
                    // console.log(data)
                    devInfo.cpuTemperature = data;

                    si.networkInterfaces()
                        .then(data => {
                            // console.log(`cpuTemperature`)
                            // console.log(data)
                            devInfo.networkInterfaces = data;


                            si.osInfo()
                                .then(data => {
                                    // console.log(`osInfo`)
                                    // console.log(data)
                                    devInfo.osInfo = data;

                                    const checkDiskSpace = require('check-disk-space').default

                                    checkDiskSpace('/').then((diskSpace) => {
                                        console.log(diskSpace)
                                        diskSpace.free = diskSpace.free / 1073741824 + " GB";
                                        diskSpace.size = diskSpace.size / 1073741824 + " GB";
                                        // console.log(diskSpace)
                                        devInfo.diskSpace = diskSpace;
                                        console.log(devInfo);

                                        client.emit('update', {
                                            to: config.userName,
                                            from: config.deviceName,
                                            type: "deviceInfo",
                                            payload: devInfo
                                        })
                                    })


                                })
                                .catch(error => console.error(error));
                        })
                        .catch(error => console.error(error));
                })
                .catch(error => console.error(error));
        })
        .catch(error => console.error(error));
}


function stopExistingContainer_c(data) {

    var lxcStop;
    if (config.containerType == "lxd") {

        lxcStop = spawn('lxc', ["stop", data.payload.containerName]);
    } else {
        lxcStop = spawn('lxc-stop', ["-n", data.payload.containerName]);
    }


    lxcStop.stdout.on('data', (data) => {
        console.log(`lxcStop stdout: ${data}`);
    });

    lxcStop.stderr.on('data', (data) => {
        console.error(`lxcStop stderr: ${data}`);

    });

    lxcStop.on('close', (code) => {
        console.log(`lxcStop child process exited with code ${code}`);
        if (config.containerType == "lxd") {
            var cb = function(name, data) {
                var output = {}
                output[name] = data;
                console.log("output => " + output);
                console.log("sending message")
                client.emit('lxd_statusUpdate', output, config.deviceName)
            }
            setTimeout(function() { lxd_containerStatus(data.payload.containerName, cb) }, 2000);

        } else {
            setTimeout(function() { getContainerStatus(data.payload.containerName, getContainerStatusCb) }, 2000);
            client.emit('stopExistingContainer', {
                to: config.userName,
                from: config.deviceName,
                type: "stopExistingContainer",
                containerName: data.payload.containerName,
                status: `lxcStop child process exited with code ${code}`,
                returnValue: code
            })
        }


    });

}


function startExistingContainer_c(data) {

    var lxcStart;
    if (config.containerType == "lxd") {

        lxcStart = spawn('lxc', ["start", data.payload.containerName]);
    } else {
        lxcStart = spawn('lxc-start', ["-n", data.payload.containerName]);
    }


    lxcStart.stdout.on('data', (data) => {
        console.log(`lxcStart stdout: ${data}`);
    });

    lxcStart.stderr.on('data', (data) => {
        console.error(`lxcStart stderr: ${data}`);

    });

    lxcStart.on('close', (code) => {
        console.log(`lxcStart child process exited with code ${code}`);


        if (config.containerType == "lxd") {
            var cb = function(name, data) {
                var output = {}
                output[name] = data;
                console.log("output => " + output);
                console.log("sending message")
                client.emit('lxd_statusUpdate', output, config.deviceName)
            }
            setTimeout(function() { lxd_containerStatus(data.payload.containerName, cb) }, 2000);

        } else {
            setTimeout(function() { getContainerStatus(data.payload.containerName, getContainerStatusCb) }, 2000);
            client.emit('update', {
                to: config.userName,
                from: config.deviceName,
                type: "startContainer",
                containerName: data.payload.containerName,
                status: `lxcStart child process exited with code ${code}`,
                returnValue: code
            })
        }
    });

}


function startContainer_c(data) {

    console.log("data.payload.containerName = " + data.payload.containerName)
    const lxcStart = spawn('lxc-start', ["-n", data.payload.containerName]);
    lxcStart.stdout.on('data', (data) => {
        console.log(`lxcStart stdout: ${data}`);
    });

    lxcStart.stderr.on('data', (data) => {
        console.error(`lxcStart stderr: ${data}`);

    });

    lxcStart.on('close', (code) => {
        console.log(`lxcStart child process exited with code ${code}`);

        setTimeout(function() { getContainerStatus(data.payload.containerName, getContainerStatusCb) }, 2000);
        client.emit('update', {
            to: config.userName,
            from: config.deviceName,
            type: "startContainer",
            containerName: data.payload.containerName,
            status: `lxcStart child process exited with code ${code}`
        })
        if (code == 0) {

            client.emit('update', {
                // data: data,
                to: config.userName,
                from: config.deviceName,
                type: "download",
                statusCode: 4,
                containerName: data.payload.containerName,
                status: `lxcStart child process exited with code ${code}`,
                description: "Image created and started."
            })

            const postStartConfig = spawn(`../../config/${data.payload.device}/postStartConfig.sh`, []);

            postStartConfig.stdout.on('data', (data) => {
                // console.log(`stdout: ${data}`);
            });

            postStartConfig.stderr.on('data', (data2) => {
                console.error(`stderr: ${data2}`);
                client.emit('update', {
                    data: data2,
                    type: "download",
                    to: config.userName,
                    containerName: data.payload.containerName,
                    from: config.deviceName
                })
            });

            postStartConfig.on('close', (code) => {
                console.log(`postStartConfig child process exited with code ${code}`);
                deviceInfo_c();
                if (code == 0) {
                    client.emit('update', {
                        // data: data,
                        to: config.userName,
                        from: config.deviceName,
                        type: "download",
                        statusCode: 4.5,
                        containerName: data.payload.containerName,
                        status: `postStartConfig child process exited with code ${code}`,
                        description: "Image created and post start configuration done; ready to start."
                    })
                } else {
                    client.emit('update', {
                        // data: data,
                        to: config.userName,
                        from: config.deviceName,
                        type: "download",
                        statusCode: -4.5,
                        containerName: data.payload.containerName,
                        status: `postStartConfig child process exited with code ${code}`,
                        description: "Image created and post start configuration failed;."
                    })
                }

            })


        } else {
            client.emit('update', {
                // data: data,
                to: config.userName,
                from: config.deviceName,
                type: "download",
                statusCode: -4,
                containerName: data.payload.containerName,
                status: `lxcStart child process exited with code ${code}`,
                description: "Image start failed."
            })
        }

    });

}




//message.serviceName => if want to check single service
//message.serviceNameArr => if want to check multiple state 

//sample message 
// {
//     to: 'Raspberry_1',
//     cc: 'alpha',
//     type: 'isServiceAvailable',
//     payload: {
//       type: 'isServiceAvailable',
//       name: 'cam7',
//       device: 'camera',
//       userName: 'alpha',
//       dependentServiceArr: [ 'lxc', 'lxd' ]
//     },
//     from: 'a7Avoumiyn1zM6GNAAAJ'
//   }

function isServiceAvailable_c(message) {
    console.log(message)
    var serviceNameArr = message.payload.dependentServiceArr;
    console.log(message.payload.dependentServiceArr);
    var ans = {};
    ans.to = "publisher";
    ans.cc = config.userName;
    ans.type = "isServiceAvailableCB";
    ans.payload = { serviceStat: [], id: message.payload.id, containerName: message.payload.name }
    ans.from = config.deviceName;

    for (var i = 0; i < serviceNameArr.length; i++) {
        var serviceName = serviceNameArr[i];
        var cmd = `
    if systemctl --all --type service | grep -q "${serviceName}";then
        echo '{\"service\":\"${serviceName}\", \"isServiceAvailable\":true}'
    else
        echo '{\"service\":\"${serviceName}\", \"isServiceAvailable\":false}'
    fi`


        var process = child_process.exec(cmd, function(error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: ' + error.code);
                console.log('Signal received: ' + error.signal);
            }
            console.log('stdout: ' + stdout);
            stdout = JSON.parse(stdout)

            if (stdout.isServiceAvailable) {
                var process2;
                if (stdout.service == "lxc-net") {
                    process2 = child_process.exec(`systemctl is-active --quiet ${stdout.service}.service || ((mkdir -p /var/lib/misc/) && systemctl restart ${stdout.service})`, function(error, stdout, stderr) {
                        if (error) {
                            console.log(error.stack);
                            console.log('Error code: ' + error.code);
                            console.log('Signal received: ' + error.signal);
                        }
                    });
                } else {
                    process2 = child_process.exec(`systemctl is-active --quiet ${stdout.service}.service || systemctl restart ${stdout.service}`, function(error, stdout, stderr) {
                        if (error) {
                            console.log(error.stack);
                            console.log('Error code: ' + error.code);
                            console.log('Signal received: ' + error.signal);
                        }
                    });
                }
                process2.on('exit', function(code) {
                    console.log(' Child process2 exited with exit code ' + code);
                    var cmd2 = `
                    if systemctl is-active --quiet ${stdout.service}.service ;then
                        echo '{\"service\":\"${stdout.service}\", \"isServiceAvailable\":true, \"isServiceRunning\":true}'
                    else
                        echo '{\"service\":\"${stdout.service}\", \"isServiceAvailable\":true, \"isServiceRunning\":false}'
                    fi`
                    console.log(cmd2)
                    var process3 = child_process.exec(cmd2, function(error, stdout, stderr) {
                        if (error) {
                            console.log(error.stack);
                            console.log('Error code: ' + error.code);
                            console.log('Signal received: ' + error.signal);
                        } else {
                            console.log('stdout: ' + stdout);
                            stdout = JSON.parse(stdout);
                            ans.payload.serviceStat.push(stdout);
                            if (ans.returnValue == undefined || ans.returnValue) {
                                ans.returnValue = stdout.isServiceRunning;
                                ans.statusCode = ans.returnValue ? 0.5 : -0.5;
                            }
                            if (ans.payload.serviceStat.length == serviceNameArr.length) {
                                console.log("...................all done ")
                                console.log(ans)
                                client.emit('update', ans)
                            }
                        }
                    });
                    process3.on('exit', function(code) {
                        console.log(' Child process3 exited with exit code ' + code);
                    });
                });
            } else {
                ans.payload.serviceStat.push(stdout);
                ans.returnValue = false;
                ans.statusCode = -0.5;
                if (ans.length == serviceNameArr.length) {
                    console.log("...................all done ")
                    console.log(ans)
                    client.emit('update', ans)
                }
            }
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
        });

        process.on('exit', function(code) {
            console.log(' Child process1 exited with exit code ' + code);
        });


    }
}



function cleaning_c(message) {
    console.log(message)
    var fs = require('fs');
    var script_name = `./clean_${message.payload.containerName}.sh`;
    var script_content = message.payload.cleaningScript;
    fs.writeFileSync(script_name, script_content);
    fs.chmodSync(script_name, "755");

    const clean = spawn(`./clean_${message.payload.containerName}.sh`, ["-d", message.payload.url, "-n", message.payload.containerName, "-a", "linux32"]);
    clean.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    clean.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    clean.on('close', (code) => {
        console.log(`clean child process exited with code ${code}`);

        if (code == 0) {
            client.emit('update', {
                to: "publisher",
                cc: config.userName,
                from: config.deviceName,
                type: "cleaningCB",
                payload: {
                    statusCode: 1,
                    id: message.payload.id,
                    containerName: message.payload.containerName,
                    status: `clean child process exited with code ${code}`,
                    description: "Image clean successful."
                },
                returnValue: true
            })
        } else {
            client.emit('update', {
                to: "publisher",
                cc: config.userName,
                from: config.deviceName,
                type: "cleaningCB",
                payload: {
                    statusCode: -1,
                    id: message.payload.id,
                    containerName: message.payload.containerName,
                    status: `clean child process exited with code ${code}`,
                    description: "Image clean successful."
                },
                returnValue: false
            })
        }
    });
}



function downloadNew_c(message) {
    console.log(message)

    const wget = spawn('wget', [message.payload.url]);
    wget.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);

    });

    wget.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);

        client.emit('update', {
            to: config.userName,
            from: config.deviceName,
            type: "downloadNew",
            payload: {
                statusCode: 1.5,
                id: message.payload.id,
                data: data.toString(),
                containerName: message.payload.containerName,
                status: `Connected and downloading`,
                description: "Image is getting downloaded."
            }
        })
    });

    wget.on('close', (code) => {

        console.log(`wget child process exited with code ${code}`);
        if (code == 0) {
            client.emit('update', {
                to: "publisher",
                cc: config.userName,
                from: config.deviceName,
                type: "downloadCB",
                payload: {
                    statusCode: 2,
                    id: message.payload.id,
                    containerName: message.payload.containerName,
                    status: `wget child process exited with code ${code}`,
                    description: "Image successfully downloaded."
                },
                returnValue: true
            })

        } else {
            setTimeout(() => {

                client.emit('update', {
                    to: "publisher",
                    cc: config.userName,
                    from: config.deviceName,
                    type: "downloadCB",
                    payload: {
                        statusCode: -2,
                        id: message.payload.id,
                        containerName: message.payload.containerName,
                        status: `wget child process exited with code ${code}`,
                        description: "Image successfully downloaded."
                    },
                    returnValue: false
                })
            }, 10);
        }
    });
}

function config_c(message) {
    console.log(message)
    var fs = require('fs');
    var script_name = `./config_${message.payload.containerName}.sh`;
    var script_content = message.payload.creationScript;
    var configFile = message.payload.configFile;
    var configFileName = `/var/lib/lxc/${message.payload.containerName}/config`;
    fs.writeFileSync(configFileName, configFile);
    fs.chmodSync(configFileName, "755");

    fs.writeFileSync(script_name, script_content);
    fs.chmodSync(script_name, "755");

    var randomMac = require('random-mac');
    var mac = randomMac()
    console.log(mac)

    const create = spawn(script_name, ["-d", message.payload.url, "-n", message.payload.containerName, "-a", "linux32", "-t", message.payload.device, "-m", mac]);

    create.stdout.on('data', (data) => {
        // console.log(`stdout: ${data}`);
    });

    create.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);

    });

    create.on('close', (code) => {

        console.log(`create child process exited with code ${code}`);
        if (code == 0) {
            client.emit('update', {
                to: "publisher",
                cc: config.userName,
                from: config.deviceName,
                type: "configCB",
                payload: {
                    statusCode: 3,
                    id: message.payload.id,
                    containerName: message.payload.containerName,
                    status: `create child process exited with code ${code}`,
                    description: "Image created and ready to configure."
                },
                returnValue: true
            })
        } else {
            client.emit('update', {
                to: "publisher",
                cc: config.userName,
                from: config.deviceName,
                type: "configCB",
                payload: {
                    statusCode: -3,
                    id: message.payload.id,
                    containerName: message.payload.containerName,
                    status: `create child process exited with code ${code}`,
                    description: "Image created and ready to configure."
                },
                returnValue: false
            })
        }
    });
}


function preStartConfig_c(message) {

    console.log(message)
    var fs = require('fs');
    var script_name = `./preStartConfig_${message.payload.containerName}.sh`;
    var script_content = message.payload.preStartConfigScript;
    fs.writeFileSync(script_name, script_content);
    fs.chmodSync(script_name, "755");

    const preStartConfig = spawn(script_name, []);

    preStartConfig.stdout.on('data', (data) => {
        // console.log(`stdout: ${data}`);
    });

    preStartConfig.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    preStartConfig.on('close', (code) => {

        console.log(`preStartConfig child process exited with code ${code}`);
        if (code == 0) {
            client.emit('update', {
                to: "publisher",
                cc: config.userName,
                from: config.deviceName,
                type: "preStartConfigCB",
                payload: {
                    statusCode: 3.5,
                    id: message.payload.id,
                    containerName: message.payload.containerName,
                    status: `preStartConfig child process exited with code ${code}`,
                    description: "Image created and pre start configuration done; ready to start."
                },
                returnValue: true
            })
        } else {
            client.emit('update', {
                to: "publisher",
                cc: config.userName,
                from: config.deviceName,
                type: "preStartConfigCB",
                payload: {
                    statusCode: -3.5,
                    id: message.payload.id,
                    containerName: message.payload.containerName,
                    status: `preStartConfig child process exited with code ${code}`,
                    description: "Image created and pre start configuration done; ready to start."
                },
                returnValue: false
            })
        }
    });

}


function startContainerNew_c(message) {
    console.log("startContainerNew_c")
    console.log(message)
    console.log("data.payload.containerName = " + message.payload.containerName)
    const lxcStart = spawn('lxc-start', ["-n", message.payload.containerName]);
    lxcStart.stdout.on('data', (data) => {
        console.log(`lxcStart stdout: ${data}`);
    });

    lxcStart.stderr.on('data', (data) => {
        console.error(`lxcStart stderr: ${data}`);
    });

    lxcStart.on('close', (code) => {
        console.log(`lxcStart child process exited with code ${code}`);
        setTimeout(function() { getContainerStatus(message.payload.containerName, getContainerStatusCb) }, 2000);
        if (code == 0) {

            client.emit('update', {
                to: "publisher",
                cc: config.userName,
                from: config.deviceName,
                type: "startContainerCB",
                payload: {
                    statusCode: 4,
                    id: message.payload.id,
                    containerName: message.payload.containerName,
                    status: `lxcStart child process exited with code ${code}`,
                    description: "Image created and started."
                },
                returnValue: true
            })

        } else {
            client.emit('update', {
                to: "publisher",
                cc: config.userName,
                from: config.deviceName,
                type: "startContainerCB",
                payload: {
                    statusCode: -4,
                    id: message.payload.id,
                    containerName: message.payload.containerName,
                    status: `lxcStart child process exited with code ${code}`,
                    description: "Image start failed."
                },
                returnValue: false
            })
        }
    });
}


function postStartConfig_c(message) {

    console.log(message)
    var fs = require('fs');
    var script_name = `./postStartConfig_${message.payload.containerName}.sh`;
    var script_content = message.payload.postStartConfigScript;
    fs.writeFileSync(script_name, script_content);
    fs.chmodSync(script_name, "755");

    const postStartConfig = spawn(script_name, []);

    postStartConfig.stdout.on('data', (data) => {
        // console.log(`stdout: ${data}`);
    });

    postStartConfig.stderr.on('data', (data2) => {
        console.error(`stderr: ${data2}`);

    });

    postStartConfig.on('close', (code) => {
        console.log(`postStartConfig child process exited with code ${code}`);
        deviceInfo_c();

        if (code == 0) {
            client.emit('update', {
                to: "publisher",
                cc: config.userName,
                from: config.deviceName,
                type: "postStartConfigCB",
                payload: {
                    statusCode: 4.5,
                    id: message.payload.id,
                    containerName: message.payload.containerName,
                    status: `postStartConfig child process exited with code ${code}`,
                    description: "Image created and post start configuration done; ready to start."
                },
                returnValue: true
            })
        } else {
            client.emit('update', {
                to: "publisher",
                cc: config.userName,
                from: config.deviceName,
                type: "postStartConfigCB",
                payload: {
                    statusCode: -4.5,
                    id: message.payload.id,
                    containerName: message.payload.containerName,
                    status: `postStartConfig child process exited with code ${code}`,
                    description: "Image created and post start configuration failed;."
                },
                returnValue: false
            })
        }
    })
}



//api or container name also will work 
function lxd_containerStatus(api, callback) {
    console.log("lxd_containerStatus")
    console.log("api = " + api)
    var name = api.split("/")

    if (name.length < 2) {
        name = api;
        api = "/1.0/containers/" + name + "/state";
    } else {
        name = name[name.length - 1]
    }

    console.log(`curl -s --unix-socket /var/lib/lxd/unix.socket  a${api}`)
    const cp = spawn("sh", ["-c", `curl -s --unix-socket /var/lib/lxd/unix.socket  a${api}`]);
    var ans = "";
    cp.stdout.on('data', (data) => {
        console.log(`lxd_containerStatus stdout: ${data}`);
        ans += data.toString('utf8');
    });

    cp.stderr.on('data', (data) => {
        console.error(`lxd_containerStatus stderr: ${data}`);

    });

    cp.on('close', (code) => {
        console.log(`lxd_containerStatus child process exited with code ${code}`);
        ans = JSON.parse(ans)
        callback(name, ans);

    })
}

//get container list from server
function lxd_getStatusOfContainers_c(message) {
    console.log("lxd_getStatusOfContainers_c")
    console.log(message)
    var output = {}
    var cb = function(name, data) {
        output[name] = data;
        console.log("output => " + output);
        console.log("message.payload.contArr = " + message.payload.contArr.length + " Object.keys(output).length = " + Object.keys(output).length)
        if (message.payload.contArr.length == Object.keys(output).length) {
            console.log("sending message")
            client.emit('lxd_statusUpdate', output, config.deviceName)
        }
    }
    message.payload.contArr.forEach(element => {

        lxd_containerStatus(element.containerName, cb)
    });

}


//get container list from device
function lxd_containersStatus_c(message) {
    // const sp = spawn("sh", ["-c", `sudo -S <<< "${config.build.password}" lxc image copy  ${contName} ${config.lxdImageServer.name}: --copy-aliases`]);

    const cp = spawn("sh", ["-c", "curl -s --unix-socket /var/lib/lxd/unix.socket  a/1.0/containers"]);
    var ans = "";
    cp.stdout.on('data', (data) => {
        console.log(`a/1.0/containers stdout: ${data}`);
        ans += data.toString('utf8');

    });

    cp.stderr.on('data', (data) => {
        console.error(`a/1.0/containers stderr: ${data}`);
    });

    cp.on('close', (code) => {
        console.log(`a/1.0/containers child process exited with code ${code}`);
        console.log(" ans = " + ans);
        ans = JSON.parse(ans)
        var output = {}
        var cb = function(name, data) {
            output[name] = data;
            if (ans.metadata.length == Object.keys(output).length) {
                // curl -s --unix-socket /var/lib/lxd/unix.socket  a/1.0/instances/alp/state
                //TODO

            }
        }

        ans.metadata.forEach(element => {
            console.log("element = " + element)
            lxd_containerStatus(element, cb)

        });


    });

}

function lxd_imageCopy(host, imageName){

}

function lxd_containerCreate_c(message) {
    console.log("lxd_containerCreate_c 1")
    var host = "local";

    var launch =  ()=> {

        var cmd = `lxc launch ${message.formData.device} ${message.formData.containerName} `
        console.log(cmd)
        var launch = spawn("sh", ["-c", cmd], { stdio: ['ignore','pipe', 'pipe']});
        // const cp = spawn(`lxc`, ["launch", `${config.lxdImageServer.name}:${message.formData.device}`, `${message.formData.containerName}`]);
        console.log("Creating container")
        launch.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            console.log(`lxd_containerCreate_c stdout: ${data}`);
            if (data.toString('utf8').includes("Creating")) {
    
                setTimeout(function() {
    
                    client.emit('update', {
                        to: "publisher",
                        cc: config.userName,
                        from: config.deviceName,
                        type: "downloadCB",
                        payload: {
                            statusCode: 2,
                            containerName: message.formData.containerName,
                            status: `Creating container.`,
                            description: "Image successfully downloaded."
                        },
                        returnValue: true
                    })
    
    
                }, 1000);
            }
            if (data.toString('utf8').includes("Starting")) {
    
    
    
            }
    
        });
    
        launch.stderr.on('data', (data) => {
            console.error(`lxd_containerCreate_c stderr: ${data}`);
        });
    
        launch.on('close', (code) => {
            console.log(`lxd_containerCreate_c child process exited with code ${code}`);
    
            if (code == 0) {
                var cb2 = function(name, data) {
                    var output = {}
                    output[name] = data;
                    console.log("output => " + output);
                    console.log("sending message");
                    client.emit('lxd_statusUpdate', output, config.deviceName);
    
                    client.emit('update', {
                        to: "publisher",
                        cc: config.userName,
                        from: config.deviceName,
                        type: "startContainerCB",
                        payload: {
                            statusCode: 4.5,
                            containerName: message.formData.containerName,
                            status: `Container starting exited.`,
                            description: "Image created and started."
                        },
                        returnValue: true
                    })
                }
                lxd_containerStatus(message.formData.containerName, cb2);
    
               /* if ((typeof message.formData.source != 'undefined') && (typeof message.formData.destination != 'undefined') &&
                    (typeof message.formData.deviceType != 'undefined')) {
                    lxd_deviceMount(message.formData.containerName, message.formData.source, message.formData.destination, message.formData.deviceType)
                }*/
    
                if (typeof message.formData.cgroup != 'undefined') {
    
                    var cb2 = (code) => {
                        if (code == 0) {
    
                            message.formData.deviceSupport.forEach((element, index, array) => {
                                if (element == "camera") {
                                    // lxd_postConfigCamera(message.formData.containerName, cb)
                                     var cp2 = spawn("sh", ["-c", `killall ${config.socat.path} `]);
                                            cp2.stderr.on('data', (data) => {
                                                console.error(`network up 2 stderr: ${data}`);
                                            });
                                            cp2.on('close', (code) => {
                                                console.log(`network up 2 ${cp2.spawnargs} :  ${code}`);
                                                var cp3 = spawn("sh", ["-c", `lxc config set ${message.formData.containerName} security.privileged true `]);
                                                cp3.stderr.on('data', (data) => {
                                                    console.error(`security.privileged  up  stderr: ${data}`);
                                                 });
                                                cp3.on('close', (code) => {
                                                console.log(`security.privileged up ${cp2.spawnargs} :  ${code}`);
                                                var cp4 = spawn("sh", ["-c", `lxc restart ${message.formData.containerName}`]);
                                                cp4.stderr.on('data', (data) => {
                                                    console.error(`lxc restart  stderr: ${data}`);
                                                });
                                                cp4.on('close', (code) => {
                                                    console.log(`lxc restart  ${cp4.spawnargs} :  ${code}`);
                                                    setTimeout(function(){lxd_startsocat_c(message.formData.containerName);},2000)
                                                    })
                                                })
                                                
                                                //  lxd_startsocat_c(message.formData.containerName); 
                                            })
    
                                    
                                }
                                if (element == "speaker") {
                                    // lxd_postConfigSpeaker(message.formData.containerName, cb)
    
    
                                    var cp3 = spawn("sh", ["-c", `lxc config device add ${message.formData.containerName} pulsesocket proxy connect=unix:/var/run/pulse/native listen=unix:/home/root/.pulse_sock bind=container uid=0 gid=0 mode=0777 security.uid=0 security.gid=0`]);
                                    cp3.stderr.on('data', (data) => {
                                        console.error(`pulsesocket up  stderr: ${data}`);
                                    });
                                    cp3.on('close', (code) => {
                                        console.log(`pulsesocket up ${cp3.spawnargs} :  ${code}`);
    
                                        var cp2 = spawn("sh", ["-c", `lxc config set ${message.formData.containerName} security.privileged true `]);
                                        cp2.stderr.on('data', (data) => {
                                            console.error(`security.privileged  up  stderr: ${data}`);
                                        });
                                        cp2.on('close', (code) => {
                                            console.log(`security.privileged up ${cp2.spawnargs} :  ${code}`);
                                            var cp4 = spawn("sh", ["-c", `lxc restart ${message.formData.containerName}`]);
                                            cp4.stderr.on('data', (data) => {
                                                console.error(`lxc restart  stderr: ${data}`);
                                            });
                                            cp4.on('close', (code) => {
                                                console.log(`lxc restart  ${cp4.spawnargs} :  ${code}`);
                                            })
                                        })
                                    })
    
                                }
                                console.log(`index = ${index}  array.length = ${array.length} `)
                                if (array.length - 1 == index) {
                                   // var cp2 = spawn("sh", ["-c", `lxc restart ${message.formData.containerName}`]);
                                   // cp2.stderr.on('data', (data) => {
                                   //     console.error(`lxc restart  stderr: ${data}`);
                                   // });
                                   // cp2.on('close', (code) => {
                                   //     console.log(`lxc restart  ${cp2.spawnargs} :  ${code}`);
                                   // })
                                }
    
                            });
                        }
                    }
            var cb = (code) => {
                        if (code == 0) {
                            if ((typeof message.formData.source != 'undefined') && (typeof message.formData.destination != 'undefined') &&
                                (typeof message.formData.deviceType != 'undefined')) {
                                lxd_deviceMount(message.formData.containerName, message.formData.source, message.formData.destination, message.formData.deviceType,cb2)
                            }
                        }
                    }
                    lxd_CGroupPermission(message.formData.containerName, message.formData.cgroup, cb)
                }
    
                // message.formData.deviceSupport.forEach(element => {
                //     if (element == "camera") {
                //         lxd_postConfigCamera(message.formData.containerName, cb)
                //     }
                //     if (element == "speaker") {
                //         lxd_postConfigSpeaker(message.formData.containerName, cb)
                //     }
    
                // });
    
    
            } else {
                client.emit('update', {
                    to: "publisher",
                    cc: config.userName,
                    from: config.deviceName,
                    type: "startContainerCB",
                    payload: {
                        statusCode: -4.5,
                        containerName: message.formData.containerName,
                        status: `Container starting failed.`,
                        description: "Unable to create container."
                    },
                    returnValue: true
                })
            }
        });
    }
    if(message.formData.mode == "local"){
        host  = "local";
        launch()
    }else{
       var cmd = `lxc image copy  ${config.lxdImageServer.name}:${message.formData.device} local: --copy-aliases`;
       console.log(cmd)
        var cp = spawn("sh", ["-c", cmd]);

        cp.stdout.on('data', (data) => {
            console.log(`lxc image copy  stdout ${cp.spawnargs}: ${data}`);

        });
        cp.stderr.on('data', (data) => {
            console.error(`lxc image copy  stderr ${cp.spawnargs}: ${data}`);
        });
        cp.on('close', (code) => {
            console.log(`lxc image copy  child process exited with code ${cp.spawnargs}: ${code}`);
            launch()
        })
        
    }


   

}

function lxd_deviceMount(name, source, destination, deviceType, cb) {

    console.log("lxd_deviceMount start")
    var cmd = "";

    if (Array.isArray(source)) {
        source.forEach((element, index) => {
            var elementName = destination[index].split("/").join("_");
            cmd += `lxc config device add ${name} ${elementName} ${deviceType[index]} source=${source[index]} path=${destination[index]} &&`
        });
        cmd = cmd.substring(0, cmd.length - 2);
    } else {
        cmd = `lxc config device add ${name} ${elementName} ${deviceType} source=${source} path=${destination}`
    }


    var cp = spawn("sh", ["-c", cmd]);

    cp.stdout.on('data', (data) => {
        console.log(`device mount stdout ${cp.spawnargs}: ${data}`);

    });
    cp.stderr.on('data', (data) => {
        console.error(`device mount stderr ${cp.spawnargs}: ${data}`);
    });
    cp.on('close', (code) => {
        console.log(`device mount child process exited with code ${cp.spawnargs}: ${code}`);
        cb(code);
    })
}

//cgroup = []
function lxd_CGroupPermission(name, cgroup, cb) {
    // console.log(`lxc config device set ${name} raw.lxc="lxc.cgroup.devices.allow =c 81:* rwm"`)
    // var cp = spawn("sh", ["-c", `lxc config device set ${name} raw.lxc="lxc.cgroup.devices.allow =c 81:* rwm"`]);
    // /home/root# printf 'lxc.cgroup.devices.allow = c 10 237\nlxc.cgroup.devices.allow = b 7 *' | lxc config set alp raw.lxc -
    //  
    console.log("lxd_CGroupPermission start")
    var innerCmd = ""
    if (Array.isArray(cgroup)) {
        cgroup.forEach((element) => {
            innerCmd += `lxc.cgroup.devices.allow =${element}\n`
        });
        innerCmd.substring(0, innerCmd.length - 1);
    }
    console.log("innerCmd = " + innerCmd)
    var cmd = `printf '${innerCmd}' | lxc config set ${name} raw.lxc -`
    console.log(` cmd = ${cmd}`)
    var cp = spawn("sh", ["-c", cmd]);

    cp.stdout.on('data', (data) => {
        console.log(`device mount stdout ${cp.spawnargs}: ${data}`);
    });
    cp.stderr.on('data', (data) => {
        console.error(`device mount stderr ${cp.spawnargs}: ${data}`);
    });
    cp.on('close', (code) => {
        console.log(`device mount child process exited with code ${cp.spawnargs}: ${code}`);
        cb(code);
    })

}


function lxd_postContainerConfig(deviceMount, cgroup) {
    lxd_deviceMount(deviceMount)
    lxd_CGroupPermission(cgroup)

    // var dirMount = [{
    //         name: "tmp",
    //         source: "/tmp",
    //         destination: "/tmp",
    //         deviceType: "disk"
    //     },
    //     {
    //         name: "dri",
    //         source: "/dev/dri",
    //         destination: "/dev/dri",
    //         deviceType: "disk"
    //     },
    //     {
    //         name: "mem",
    //         source: "/dev/mem",
    //         destination: "/dev/mem",
    //         deviceType: "disk"
    //     },
    //     {
    //         name: "wayland0",
    //         source: "/tmp/xdg/wayland-0",
    //         destination: "/tmp/wayland-0",
    //         deviceType: "disk"
    //     },
    //     {
    //         name: "video0",
    //         source: "/dev/video0",
    //         deviceType: "unix-char"
    //     },
    //     {
    //         name: "video1",
    //         source: "/dev/video1",
    //         deviceType: "unix-char"
    //     },
    //     {
    //         deviceType: "cgroupCamera"
    //     }
    // ]
    // var index = 0;
    // dirMount.forEach(element => {
    //     setTimeout(() => {
    //         if (element.deviceType == "disk") {
    //             var cp = spawn("sh", ["-c", `lxc config device add ${name} ${element.name} ${element.deviceType} source=${element.source} path=${element.destination}`]);

    //             cp.stdout.on('data', (data) => {
    //                 console.log(`device mount stdout: ${data}`);
    //             });
    //             cp.stderr.on('data', (data) => {
    //                 console.error(`device mount stderr: ${data}`);
    //             });
    //             cp.on('close', (code) => {
    //                 console.log(`device mount child process exited with code ${code}`);
    //             })

    //         } else if (element.deviceType == "unix-char") {
    //             var cp = spawn("sh", ["-c", `lxc config device add ${name} ${element.name} ${element.deviceType} path=${element.source}`]);

    //             cp.stdout.on('data', (data) => {
    //                 console.log(`device mount stdout: ${data}`);
    //             });
    //             cp.stderr.on('data', (data) => {
    //                 console.error(`device mount stderr: ${data}`);
    //             });
    //             cp.on('close', (code) => {
    //                 console.log(`device mount child process exited with code ${code}`);
    //             })
    //         } else if (element.deviceType == "cgroupCamera") {
    //             console.log(`lxc config device set ${name} raw.lxc="lxc.cgroup.devices.allow =c 81:* rwm"`)
    //             var cp = spawn("sh", ["-c", `lxc config device set ${name} raw.lxc="lxc.cgroup.devices.allow =c 81:* rwm"`]);

    //             cp.stdout.on('data', (data) => {
    //                 console.log(`device mount stdout: ${data}`);
    //             });
    //             cp.stderr.on('data', (data) => {
    //                 console.error(`device mount stderr: ${data}`);
    //             });
    //             cp.on('close', (code) => {
    //                 console.log(`device mount child process exited with code ${code}`);
    //             })
    //         }
    //     }, 500 * index++);

    // });

}



module.exports = {
    setIOClient,
    deviceInfo_c,
    downloadContainer_c,
    startContainer_c,
    getStatusOfAllContainer_c,
    getStatusOfContainers_c,
    deleteExistingContainer_c,
    stopExistingContainer_c,
    startExistingContainer_c,
    isServiceAvailable_c,
    cleaning_c,
    downloadNew_c,
    config_c,
    preStartConfig_c,
    startContainerNew_c,
    postStartConfig_c,
    lxd_containersStatus_c,
    lxd_getStatusOfContainers_c,
    lxd_containerCreate_c
}