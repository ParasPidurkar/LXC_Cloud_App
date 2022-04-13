const config = require('getconfig')

const io = require('socket.io-client')
const { spawn } = require('child_process');

var fs = require('fs')


var imagePackage = require('./config/imagePackage.json')



// console.log(package)


//camera => basic, dhcp-client, google-assistant, speaker
//speaker => basic, dhcp-client, camera, livecam-demo

let socketURL
if (config.server.secure) {
    socketURL = `https://${config.server.ip}:${config.server.port}`
} else {
    socketURL = `http://${config.server.ip}:${config.server.port}`
}

const socketOptions = {
    transports: ['websocket'],
    'force new connection': true,
    secure: config.server.secure,

    query: {
        token: 'cf29386d4478b579d37db9d67ec3ae6694cfb00953446bcda4554870ec527df86425997ac98b6f8e526584a00b83a24177b1e43b6824e3c7fb78aa8a1b779304e69b4436d2a5d1dfb7dcc287b5de9e66e66a221aa70dc24516d123de52a929022347f3beee9a97a06668515bb6409a890c17754e397b620cd3b5c1a11100786bc5c2ca1c4f9e3f82a9490fa028fe1e1725bfde4a725e3dd32cd94abed48500e1eb6be50c2a6163918d538cc4ab02859b28ed36cb837cf7506b63b9513d9e40a2'
    }
}


var makeStat = false;

function makeFunction(recipe, userName) {
    if (makeStat) {
        setTimeout(() => {
            console.log("make waiting to close previous build ......................")
            makeFunction(recipe, userName)
        }, 5000);
        return;
    }
    makeStat = true;
    console.log("make " + recipe + ".....................started")
        // const make = spawn('make', [recipe], { cwd: config.build.buildDirectory });

    console.log(`sshpass -p "${config.build.userPassword}" ssh ${config.build.userName}@${config.build.serverIp} "cd ${config.build.buildDirectory} && make ${recipe}"`);
    const make = spawn("sh", ["-c", `sshpass -p "${config.build.userPassword}" ssh ${config.build.userName}@${config.build.serverIp} "cd ${config.build.buildDirectory} && make ${recipe}"`]);
    client.emit('imageBuildUpdate', { imageName: recipe, statusCode: 1, userName: userName })

    var stat = false;
    make.stdout.on('data', (data) => {
        // var devLits = []
        console.log(`stdout make: ${data}`);

        data = data.toString('utf8');
        data = JSON.stringify(data);
        // data = data.replace(/"| /g, "");
        data = data.split("\\n");
        for (var i = 0; i < data.length - 1; ++i) {
            console.log(data[i]);
            if (/.*Tasks Summary.*succeeded/.test(data[i])) {
                console.log("........................... succeeded")
                stat = true;
            }
            if (/^Tasks Summary.*failed/.test(data[i]) && !stat) {
                console.log("........................... failed")
                start = false;
            }
        }
    });

    make.stderr.on('data', (data) => {
        console.error(`stderr make: ${data}`);

    });

    make.on('close', (code) => {
        makeStat = false;
        console.log(`make ${recipe} child process exited with code ${code}`);

        if (code == 0 && stat) {
            client.emit('imageBuildUpdate', { imageName: recipe, statusCode: 2, userName: userName })
            console.log("................ build success ");
            var contName = config.build.preAlias + "/" + recipe;
            // var metaData = config.build.metaTemplate + "/temp/" + recipe + ".tar.gz";
            var metaData = config.build.metaTemplate + "/" + recipe + "/" + recipe + ".tar.gz";
            var rootfs = config.build.buildDirectory + "/BUILD/deploy/images/raspberrypi4/" + recipe + "-raspberrypi4.rootfs.tar.bz2";
            console.log("contName = " + contName + "\nmetaData = " + metaData + "\nrootfs = " + rootfs);
            importContainer(contName, metaData, rootfs, recipe, userName);

        } else {
            client.emit('imageBuildUpdate', { imageName: recipe, statusCode: -4 })
            console.log("................ build fail ");
        }
    });
}





function importContainer(contName, metaData, rootfs, recipe, userName) {
    console.log("contName = " + contName + "\nmetaData = " + metaData + "\nrootfs = " + rootfs);
    console.log(`sudo -S <<< "${config.build.password}" lxc image import ${metaData} ${rootfs} --alias=${contName}`)
    const sp = spawn("sh", ["-c", `sudo -S <<< "${config.build.password}" lxc image import ${metaData} ${rootfs} --alias=${contName}`]);

    sp.stdout.on('data', (data) => {
        console.log(`stdout importContainer: ${data}`);

    });

    sp.stderr.on('data', (data) => {
        console.error(`stderr importContainer: ${data}`);

    });

    sp.on('close', (code) => {
        console.log(`importContainer ${contName} child process exited with code ${code}`);
        if (code == 0) {
            client.emit('imageBuildUpdate', { imageName: recipe, statusCode: 3, userName: userName })
            publishContainer(contName, recipe, userName)
        } else {
            console.log("Error lxc import image failed !!!")
            client.emit('imageBuildUpdate', { imageName: recipe, statusCode: -5 })

        }
    });

}

function publishContainer(contName, recipe, userName) {
    console.log(`sudo -S <<< "${config.build.password}" lxc image copy  ${contName} ${config.lxdImageServer.name}: --copy-aliases`);
    const sp = spawn("sh", ["-c", `sudo -S <<< "${config.build.password}" lxc image copy  ${contName} ${config.lxdImageServer.name}: --copy-aliases`]);

    sp.stdout.on('data', (data) => {
        console.log(`stdout publishContainer: ${data}`);
    });

    sp.stderr.on('data', (data) => {
        console.error(`stderr publishContainer: ${data}`);

    });

    sp.on('close', (code) => {
        console.log(`publishContainer ${contName} child process exited with code ${code}`);

        if (code == 0) {
            client.emit('imageBuildUpdate', { imageName: recipe, statusCode: 4, userName: userName })
            hubImageInfo_c()
        } else {
            console.log("Error failed to publish lxd image")
            client.emit('imageBuildUpdate', { imageName: recipe, statusCode: -6 })
        }
    });

}

function getReadyForImage(name, devices, services, architecture, description, os, userName) {
    var expected_packages = "";
    expected_packages += imagePackage.basic;
    devices.forEach(element => {
        if (!expected_packages.includes(imagePackage[element]))
            expected_packages += imagePackage[element];
    });
    services.forEach(element => {
        if (!expected_packages.includes(imagePackage[element]))
            expected_packages += imagePackage[element];
    });

    console.log(" expected_packages  = " + expected_packages)

    fs.readFile(config.build.metaTemplate + "/template/recipe.bb", 'utf8', function(err, data) {
        if (err) {
            client.emit('imageBuildUpdate', { imageName: name, statusCode: -1, userName: userName })
            return console.log(err);
        }
        var result = data.replace(/<pkg_install>/g, expected_packages);
        var recp = config.build.recipeDirectory + "/" + name + ".bb";
        var tempbb = config.build.metaTemplate + "/template/" + name + ".bb";
        fs.writeFile(tempbb, result, 'utf8', function(err) {
            if (err) {
                client.emit('imageBuildUpdate', { imageName: name, statusCode: -3, userName: userName })
                return console.log(err);
            }
            console.log("Costume recipe created at " + tempbb);
            console.log(`sshpass -p "${config.build.userPassword}" ssh ${config.build.userName}@${config.build.serverIp} "cp ${tempbb} ${config.build.recipeDirectory} "`)
            const cp = spawn("sh", ["-c", `sshpass -p "${config.build.userPassword}" ssh ${config.build.userName}@${config.build.serverIp} "cp ${tempbb} ${config.build.recipeDirectory} "`]);
            cp.stdout.on('data', (data) => {
                console.log(`stdout cp bb: ${data}`)
            });

            cp.stderr.on('data', (data) => {
                console.error(`stderr cp bb: ${data}`);

            });

            cp.on('close', (code) => {
                console.log("Costume recipe created at " + recp);
                console.log(`cp bb child process exited with code ${code}`);
                setTimeout(function() { makeFunction(name, userName) }, 5000);
            });

        });

    });
    console.log("For template referring to " + config.build.metaTemplate + "/template/temp.yaml")
    fs.readFile(config.build.metaTemplate + "/template/temp.yaml", 'utf8', function(err, data) {
        if (err) {
            client.emit('imageBuildUpdate', { imageName: name, statusCode: -2, userName: userName })
            return console.log("Error during open file" + config.build.metaTemplate + "/template/temp.yaml \n" + err);
        }
        var result = data.replace(/<architecture>/g, architecture);
        // var d = new Date();
        // var t = d.getTime();
        result = result.replace(/<os>/g, os);
        // result = result.replace(/<creation_date>/g, t); //TODO leading to issue while creating lxd image 
        var t = parseInt(Date.now() / 1000);
        console.log("creation_date = " + t)
        result = result.replace(/<creation_date>/g, t);
        result = result.replace(/<description>/g, description);
        var path = config.build.metaTemplate + "/" + name;
        var tempYaml = path + "/metadata.yaml";
        var tempTemplate = config.build.metaTemplate + "/temp/";
        var tarDestination = path + "/" + name + ".tar.gz";

        fs.mkdir(path, { recursive: true }, function(err) {
            if (err) {
                client.emit('imageBuildUpdate', { imageName: name, statusCode: -3, userName: userName })
                return console.log("Error during creating folder " + path + "\n" + err);
            }
            console.log("tempYaml = " + tempYaml)
            fs.writeFile(tempYaml, result, 'utf8', function(err) {
                if (err) {
                    client.emit('imageBuildUpdate', { imageName: name, statusCode: -3 })
                    return console.log("Error in write file at " + tempYaml + "\n" + err);
                }

                console.log("Costume yaml created at " + tempYaml);

                console.log(`sudo -S <<< "${config.build.password}" tar -cvzf ${tarDestination} -C  ${path} metadata.yaml -C ${tempTemplate} templates`)
                const cp1 = spawn("sh", ["-c", `sudo -S <<< "${config.build.password}" tar -cvzf ${tarDestination} -C  ${path} metadata.yaml -C ${tempTemplate} templates`]);

                cp1.stdout.on('data', (data) => {
                    console.log(`stdout tar: ${data}`);
                });

                cp1.stderr.on('data', (data) => {
                    console.error(`stderr tar: ${data}`);

                });

                cp1.on('close', (code) => {
                    console.log(`tar child process exited with code ${code}`);
                    if (code != 0) {
                        client.emit('imageBuildUpdate', { imageName: name, statusCode: -3, userName: userName })
                    }

                })


            });

        })
    })

}



function individualImageInfo(fingerPrint, cb) {
    // console.log(`curl -k -L  --cert ~/.config/lxc/client.crt   --key ~/.config/lxc/client.key     -H "Content-Type: application/json"    "https://10.221.40.228:8443${fingerPrint}"`)
    // const cp_imageInfo = spawn("sh", ["-c", `curl -k -L  --cert ~/.config/lxc/client.crt   --key ~/.config/lxc/client.key     -H "Content-Type: application/json"    "https://10.221.40.228:8443${fingerPrint}"`]);
    console.log(`curl -k -L  --cert ~/.config/lxc/client.crt   --key ~/.config/lxc/client.key    -H "Content-Type: application/json"    "https://${config.lxdImageServer.ip}:${config.lxdImageServer.port}${fingerPrint}"`)
    const cp_imageInfo = spawn("sh", ["-c", `curl -k -L  --cert ~/.config/lxc/client.crt   --key ~/.config/lxc/client.key    -H "Content-Type: application/json"    "https://${config.lxdImageServer.ip}:${config.lxdImageServer.port}${fingerPrint}"`]);

    var imageInfo = "";
    cp_imageInfo.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        data = data.toString('utf8');
        imageInfo += data;

    });


    cp_imageInfo.on('close', (code) => {
        console.log(`cp_imageInfo child process exited with code ${code}`);

        if (code == 0) {
            console.log(imageInfo);
            imageInfo = JSON.parse(imageInfo);
            console.log(imageInfo)
            cb(imageInfo)
                // return imageInfo;

            // ans[imageInfo.metadata.aliases[0].name] = imageInfo.metadata;

        }

    });
}



function hubImageInfo_c() {
    console.log("hubImageInfo_c");
    // const cp = spawn("sh", ["-c", `curl -k -L  --cert ~/.config/lxc/client.crt   --key ~/.config/lxc/client.key     -H "Content-Type: application/json"    "https://10.221.40.228:8443/1.0/images"`]);

    const cp = spawn("sh", ["-c", `curl -k -L  --cert ~/.config/lxc/client.crt   --key ~/.config/lxc/client.key   -H "Content-Type: application/json"   "https://${config.lxdImageServer.ip}:${config.lxdImageServer.port}/1.0/images"`]);

    var images = "";
    var ans = {};

    cp.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        data = data.toString('utf8');
        // data = JSON.stringify(data);
        images += data;
    });

    cp.stderr.on('data', (data) => {
        console.error(`stderr hubImageInfo_c: ${data}`);

    });

    cp.on('close', (code) => {
        console.log(`hubImageInfo_c child process exited with code ${code}`);
        console.log(images);
        images = JSON.parse(images);
        console.log(images)
        if (code == 0) {
            var ans = {}
            var unsuccessfulImages = 0;
            for (var i = 0; i < images.metadata.length; ++i) {
                var cb = function(temp) {
                    console.log(";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;")
                    console.log(temp)
                    if (temp.type != "error") {
                        ans[temp.metadata.aliases[0].name] = temp.metadata;

                    } else {
                        ++unsuccessfulImages;
                        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxx    error improper image at lxd hub ")
                    }

                    if (Object.keys(ans).length == images.metadata.length - unsuccessfulImages) {
                        console.log("..............................................................")
                        console.log(ans)
                        client.emit('updateImagesOnHub', ans)
                    }
                }
                individualImageInfo(images.metadata[i], cb)

            }
        }

    });
}

function onJoin(data) {
    console.log(" onJoin  = " + data);
    hubImageInfo_c()
}



const client = io.connect(socketURL, socketOptions)

client.on('connect', () => {
    console.log("connected")
    client.emit('buildJoin', "armhf", onJoin);
})



client.on("disconnect", () => {
    console.log("disconnect"); // undefined
});





function test() {
    const ls = spawn("sh", ["-c", `sudo -S <<< "${config.build.password}" lxc image list`], { cwd: '/home/sanju.bisanal/RPI/rpi4/build-webos' });
    const ls2 = spawn("sh", ["-c", `sudo -S <<< '${config.build.password}' ls`], { cwd: '/home/sanju.bisanal/RPI/rpi4/build-webos' });

    ls.stdout.on('data', (data) => {
        // var devLits = []
        console.log(`stdout: ${data}`);

    });


    ls2.stdout.on('data', (data) => {
        // var devLits = []
        console.log(`stdout: ${data}`);

    });

    ls.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);

    });

    ls.on('close', (code) => {
        console.log(`ls child process exited with code ${code}`);

    });
}

// test()



client.on('build', message => {
    console.log(" massage => ");
    console.log(message);

    switch (message.payload.type) {

        case "buildContainer":
            // makeFunction(message.payload.recipe);
            getReadyForImage(message.payload.formData.imageName, message.payload.formData.devices,
                message.payload.formData.services, message.payload.formData.architecture,
                message.payload.formData.description, message.payload.formData.os, message.payload.userName)

            //ex. FormData
            // {
            //     imageName: 'myTest1',
            //     architecture: 'armhf',
            //     os: 'webos',
            //     devices: [ 'camera' ],
            //     services: [ 'google-assistant', 'nodejs' ],
            //     description: 'WebOs test1'
            //   }
            // getReadyForImage(name, devices, services, architecture, description, os)
    }
})


client.on('updateHubImageInfo', message => {
    hubImageInfo_c();
})