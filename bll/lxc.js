const os = require("os");
const path = require('path');
const fs = require('fs');
const https = require('https');
const config = require('getconfig');
const { spawn } = require('child_process');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

require('https').globalAgent.options.ca = require('ssl-root-cas').create();
var exceutionPlaform;
var argOne;
var yes;


var log = false
switch (process.platform) {
    case "win32":
        if(log) console.log("Observed win32 platform")
        exceutionPlaform = "cmd.exe"
        argOne = "/c"
        yes = "echo y "
        break;

    case "linux":
        if(log) console.log("Observed linux platform")
        exceutionPlaform = "sh"
        argOne = "-c"
        yes = "yes y "
        break;

    default:
        if(log) console.log("Unsuported platform")
        break;
}






let instance = null

class LXDRest {

    constructor() {
        if(log) console.log("LXDRest constructor")
        var keyPath;
        var certPath;

        if (config.lxdConfigDir != undefined) {
            keyPath = path.join(config.lxdConfigDir, 'client.key')
            certPath = path.join(config.lxdConfigDir, 'client.crt')
        } else if (fs.existsSync(path.join(os.homedir(), '.config', 'lxc'))) {
            keyPath = path.join(os.homedir(), '.config', 'lxc', 'client.key')
            certPath = path.join(os.homedir(), '.config', 'lxc', 'client.crt')
        } else if (fs.existsSync(path.join(os.homedir(), 'snap', 'lxd', 'common', "config"))) {
            //default
            keyPath = path.join(os.homedir(), 'snap', 'lxd', 'common', "config", 'client.key')
            certPath = path.join(os.homedir(), 'snap', 'lxd', 'common', "config", 'client.crt')
        } else {
            if(log) console.log("error : Unable to find key and crt")
        }
        if ((!fs.existsSync(keyPath)) && (!fs.existsSync(certPath))) {
            if(log) console.log("Error: Unable to verify key and cert available at ")
            if(log) console.log(keyPath)
            if(log) console.log(certPath)
        }

        if(log) console.log(" Verify key and cert available at ")
        if(log) console.log(keyPath)
        if(log) console.log(certPath)
        this.key = fs.readFileSync(keyPath)
        this.cert = fs.readFileSync(certPath)
    }

    printValue() {
        if(log) console.log("test")
    }
    test(){
        console.log("LXDRest test")
    }


    individualImageInfo(fingerPrint, cb, ip = null) {
        if(log) console.log("individualImageInfo ip = " + ip)
        var options = {
            host: ip == null ? config.lxdImageServer.ip : ip,
            port: config.lxdImageServer.port,
            path: fingerPrint,
            method: 'GET',
            key: this.key,
            cert: this.cert
        };

        var req = https.request(options, function (res) {
            if(log) console.log('STATUS: ' + res.statusCode);
            if(log) console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            let data = '';

            res.on('data', (chunk) => {
                if(log) console.log(chunk)
                data += chunk;
            });

            res.on('end', () => {
                if(log) console.log("ans =>")
                if(log) console.log(typeof (data));
                if(log) console.log(JSON.parse(data));
                var image = JSON.parse(data);
                cb(image)
            });
        });

        req.on('error', function (e) {
            if(log) console.log('problem with request: ' + e.message);
        });

        req.end();
    }



    imagesInfo(cb_ans, ip = null) {
        if(log) console.log(" imagesInfo ip = " + ip)
        var options = {
            host: ip == null ? config.lxdImageServer.ip : ip,
            port: config.lxdImageServer.port,
            path: '/1.0/images',
            method: 'GET',
            key: this.key,
            cert: this.cert
        };

        if(log) console.log("options  = ")
        if(log) console.log(options)
        var images;

        var req = https.request(options, function (res) {
            if(log) console.log('STATUS: ' + res.statusCode);
            if(log) console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            let data = '';

            res.on('data', (chunk) => {
                // if(log) console.log(chunk)
                data += chunk;
            });

            res.on('end', () => {
                if(log) console.log("ans =>")
                // if(log) console.log(typeof(data));
                if(log) console.log(JSON.parse(data));
                images = JSON.parse(data);

                if (data != undefined) {
                    var unsuccessfulImages = 0;
                    var ans = {};

                    for (var i = 0; i < images.metadata.length; ++i) {
                        var cb = function (temp) {
                            if(log) console.log(";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;")
                            if(log) console.log(temp)
                            if (temp.type != "error") {
                                var name = temp.metadata.aliases[0] != undefined ? temp.metadata.aliases[0].name : temp.metadata.fingerprint.substring(0, 12);
                                ans[name] = temp.metadata;

                            } else {
                                ++unsuccessfulImages;
                                if(log) console.log("xxxxxxxxxxxxxxxxxxxxxxxxxx    error improper image at lxd hub ")
                            }
                            if(log) console.log("Object.keys(ans).length = " + Object.keys(ans).length)
                            if(log) console.log("images.metadata.length = " + images.metadata.length)
                            if(log) console.log("unsuccessfulImages = " + unsuccessfulImages)
                            if (Object.keys(ans).length == images.metadata.length - unsuccessfulImages) {
                                if(log) console.log("..............................................................")
                                if(log) console.log(ans)
                                cb_ans(ans)
                            }



                        }

                        if(log) console.log("typeof")
                        if(log) console.log(typeof (instance.individualImageInfo))
                        if(log) console.log(typeof (this.individualImageInfo))
                        instance.individualImageInfo(images.metadata[i], cb, ip)

                    }
                    if (images.metadata.length == 0) {
                        cb_ans({})
                    }
                } else {
                    if(log) console.log("Error in parse json")
                }
            });
        });

        req.on('error', function (e) {
            if(log) console.log('problem with request: ' + e.message);
            cb_ans(null)
        });

        req.end();
    }


    addRemoteDevice(name, ip, password, cb) {
        if(log) console.log(`${yes} | lxc remote add ${name} ${ip} --password ${password}`);
        const cp = spawn(exceutionPlaform, [argOne, `${yes}  | lxc remote add ${name} ${ip} --password ${password}`]);

        cp.stdout.on('data', (data) => {
            if(log) console.log(`stdout checkRemoteDeviceAdded ${cp.spawnargs} : ${data}`);
        });

        cp.stderr.on('data', (data) => {
            console.error(`stderr checkRemoteDeviceAdded  ${cp.spawnargs}: ${data}`);
        });

        cp.on('close', (code) => {
            if(log) console.log(`checkRemoteDeviceAdded  ${cp.spawnargs} child process exited with code ${code}`);

            if (code == 0) {
                cb()
            } else {
                if(log) console.log("addRemoteDevice Error")

            }
        });

    }

    removeLxdDevice(name, cb) {
        if(log) console.log(`lxc remote remove  ${name} `);
        const cp = spawn(exceutionPlaform, [argOne, `lxc remote remove  ${name}`]);

        cp.stdout.on('data', (data) => {
            if(log) console.log(`stdout removeLxdDevice ${cp.spawnargs} : ${data}`);
        });

        cp.stderr.on('data', (data) => {
            console.error(`stderr removeLxdDevice  ${cp.spawnargs}: ${data}`);

        });

        cp.on('close', (code) => {
            if(log) console.log(`removeLxdDevice  ${cp.spawnargs} child process exited with code ${code}`);

            if (code == 0) {
                cb()
            } else {
                if(log) console.log("removeLxdDevice Error")
            }
        });
    }

    checkRemoteDeviceAdded(name, ip, password, cb) {
        if(log) console.log("checkRemoteDeviceAdded")
        const cp = spawn(exceutionPlaform, [argOne, `lxc remote list --format json `]);
        var isExists = false;
        cp.stdout.on('data', (data) => {
            data = data.toString('utf8');
            data = JSON.parse(data);
            var keys = Object.keys(data);
            var isIpMatch = false;
            for (var i = 0; i < keys.length; i++) {
                if(log) console.log("keys[i] = " + keys[i] + " name = " + name)
                if (keys[i] == name) {
                    if(log) console.log("data[keys[i]].Addr = " + data[keys[i]].Addr + " ip = " + ip)
                    isExists = true;
                    if (data[keys[i]].Addr.includes(ip)) {
                        if(log) console.log("Ip and device name matched with existing remote devices")
                        isIpMatch = true;
                        cb();
                    } else {
                        if(log) console.log("device name matched but ip changed with existing remote devices")
                        this.removeLxdDevice(name, () => {
                            this.addRemoteDevice(name, ip, password, cb)
                        })
                    }
                    break;
                }
            }
            if(log) console.log(`stdout checkRemoteDeviceAdded ${cp.spawnargs} : ${data}`);
        });


        cp.stderr.on('data', (data) => {
            console.error(`stderr checkRemoteDeviceAdded  ${cp.spawnargs}: ${data}`);

        });

        cp.on('close', (code) => {
            if(log) console.log(`checkRemoteDeviceAdded  ${cp.spawnargs} child process exited with code ${code}`);
            if(log) console.log("isExists = " + isExists)

            if (!isExists) {
                this.addRemoteDevice(name, ip, password, cb)
            }
        });

    }


    exportImage(fingerprint, source, destination) {
        if(log) console.log("exportImage")
        return new Promise(
            function (resolve, reject) {
                if(log) console.log(fingerprint)
                if(log) console.log(source)
                if(log) console.log(destination)
                var ans = {}
                ans.fingerprint = fingerprint;
                ans.source = source;

                const cp = spawn(exceutionPlaform, [argOne, `lxc image copy ${source}:${fingerprint} ${destination}: --copy-aliases`]);

                cp.stdout.on('data', (data) => {
                    if(log) console.log(`stdout  ${cp.spawnargs} : ${data}`);
                });

                cp.stderr.on('data', (data) => {
                    console.error(`stderr   ${cp.spawnargs}: ${data}`);
                });

                cp.on('close', (code) => {
                    if(log) console.log(`  ${cp.spawnargs} child process exited with code ${code}`);

                    if (code == 0) {
                        ans.status = "exportImage success !!!";
                        ans.returnValue = true;
                        resolve(ans);
                    } else {
                        if(log) console.log(" Error")
                        ans.status = "exportImage failed !!!";
                        ans.returnValue = false;
                        reject(ans)
                    }
                });
            }
        )
    }


    listImage(deviceName) {
        if(log) console.log("listImage")
        return new Promise(
            function (resolve, reject) {
                if(log) console.log(deviceName)
                var ans = {}
                ans.deviceName = deviceName;

                const cp = spawn(exceutionPlaform, [argOne, `lxc image list ${deviceName}:  -f json`]);
                var output = ''
                cp.stdout.on('data', (data) => {
                    if(log) console.log(`stdout  ${cp.spawnargs} : ${data}`);
                    data = data.toString('utf8');
                    output += data;
                });

                cp.stderr.on('data', (data) => {
                    console.error(`stderr   ${cp.spawnargs}: ${data}`);
                });

                cp.on('close', (code) => {
                    if(log) console.log(`  ${cp.spawnargs} child process exited with code ${code}`);

                    if (code == 0) {
                        ans.ans = JSON.parse(output);
                        ans.returnValue = true;
                        resolve(ans);
                    } else {
                        if(log) console.log(" Error")
                        ans.status = "List image failed !!!";
                        ans.returnValue = false;
                        reject(ans)
                    }
                });
            }
        )
    }


    
    deleteImage(fingerprint, source) {
        if(log) console.log("deleteImage")
        return new Promise(
            function (resolve, reject) {
                if(log) console.log(fingerprint)
                if(log) console.log(source)
                var ans = {}
                ans.fingerprint = fingerprint;
                ans.source = source;

                const cp = spawn(exceutionPlaform, [argOne, `lxc image delete ${source}:${fingerprint} `]);

                cp.stdout.on('data', (data) => {
                    if(log) console.log(`stdout  ${cp.spawnargs} : ${data}`);
                });

                cp.stderr.on('data', (data) => {
                    console.error(`stderr   ${cp.spawnargs}: ${data}`);
                });

                cp.on('close', (code) => {
                    if(log) console.log(`  ${cp.spawnargs} child process exited with code ${code}`);

                    if (code == 0) {
                        ans.status = "Delete success !!!";
                        ans.returnValue = true;
                        resolve(ans);
                    } else {
                        if(log) console.log(" Error")
                        ans.status = "Delete failed !!!";
                        ans.returnValue = false;
                        reject(ans)
                    }
                });
            }
        )
    }

    // imagedelete(ip = null, fingerprint) {
    //     return new Promise((resolve, reject) => {
    //         if(log) console.log(" imagedelete ip = " + ip)
    //         var key = fs.readFileSync(path.join(os.homedir(), '.config', 'lxc', 'client.key'));
    //         var crt = fs.readFileSync(path.join(os.homedir(), '.config', 'lxc', 'client.crt'))
    //         var options = {
    //             host: ip == null ? config.lxdImageServer.ip : ip,
    //             port: config.lxdImageServer.port,
    //             path: `/1.0/images/${fingerprint}`,
    //             method: 'DELETE',
    //             key: key,
    //             cert: crt
    //         };

    //         if(log) console.log("options  = ")
    //         if(log) console.log(options)
    //         var images;

    //         var req = https.request(options, function (res) {
    //             if(log) console.log('STATUS: ' + res.statusCode);
    //             if(log) console.log('HEADERS: ' + JSON.stringify(res.headers));
    //             res.setEncoding('utf8');
    //             let data = '';

    //             res.on('data', (chunk) => {
    //                 // if(log) console.log(chunk)
    //                 data += chunk;
    //             });

    //             res.on('end', () => {
    //                 if(log) console.log("ans =>")
    //                 // if(log) console.log(typeof(data));
    //                 if(log) console.log(JSON.parse(data));
    //                 resolve(JSON.parse(data));

    //             });
    //         });

    //         req.on('error', function (e) {
    //             if(log) console.log('problem with request: ' + e.message);

    //         });

    //         req.end();
    //     })
    // }

    static async getInstance() {
        
        if (!instance) {
            instance =await new LXDRest()
        }

        return instance
    }
}
// LXDRest.getInstance().test()

module.exports = LXDRest




// LXDRest.getInstance().imagesInfo((data) => {
//     if (data != null) {
//         if(log) console.log("..............ans ")
//         if(log) console.log(data)
//     }
// })