const { create } = require('domain')
const config = require('getconfig')
const { spawn } = require('child_process');
const io = require('socket.io-client')

const {
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
    lxd_getStatusOfContainers_c,
    lxd_containerCreate_c
} = require('./utile.js');

function networkUp() {
    var cp = spawn("sh", ["-c", "lxc network show lxdbr0 | grep ipv4.address"]);

    console.log(cp.spawnargs)
    cp.stdout.on('data', (data) => {
        console.log(`network up  stdout: ${data}`);
        data = data.toString('utf8');
        var ip = data.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
        if (ip != null) {
            ip = ip[0];
            var cp2 = spawn("sh", ["-c", `ifconfig lxdbr0 up ${ip} netmask 255.255.255.0 `]);
            cp2.stderr.on('data', (data) => {
                console.error(`network up 2 stderr: ${data}`);
            });
            cp2.on('close', (code) => {
                console.log(`network up 2 ${cp2.spawnargs} :  ${code}`);
            })

        }


        console.log(cp.spawnargs)
    });
    cp.stderr.on('data', (data) => {
        console.error(`network up stderr: ${data}`);
    });
    cp.on('close', (code) => {
        console.log(`network up ${cp.spawnargs} :  ${code}`);
    })


}
networkUp();





function isCertificateValid() {
    console.log("isCertificateValid lxd")
    return new Promise((resolve, reject) => {
        const cp = spawn("sh", ["-c", ` openssl x509 -noout  -in ${config.lxdServerDir}/server.crt -checkend 0  `]);

        cp.stdout.on('data', (data) => {
            console.log(`stdout  ${cp.spawnargs} : ${data}`);
        });
        cp.stderr.on('data', (data) => {
            console.error(`stderr   ${cp.spawnargs}: ${data}`);
        });

        cp.on('close', (code) => {
            console.log(`  ${cp.spawnargs} child process exited with code ${code}`);
            if (code) {
                console.log("ERROR : LXD Certificate expired ")


                function regenerateCert() {

                    var deleteOldCert = spawn("sh", ["-c", `rm ${config.lxdServerDir}/server.* `]);

                    console.log(deleteOldCert.spawnargs)
                    deleteOldCert.stdout.on('data', (data) => {
                        console.log(`deleteOldCert   stdout: ${data}`);
                    });
                    deleteOldCert.stderr.on('data', (data) => {
                        console.error(`deleteOldCert  stderr: ${data}`);
                    });
                    deleteOldCert.on('close', (code) => {
                        console.log(`deleteOldCert ${deleteOldCert.spawnargs} :  ${code}`);
                        //restart lxd to regenerate new certificate  
                        var restart = spawn("sh", ["-c", `systemctl restart lxd `]);

                        console.log(restart.spawnargs)
                        restart.stdout.on('data', (data) => {
                            console.log(`restart   stdout: ${data}`);
                        });
                        restart.stderr.on('data', (data) => {
                            console.error(`restart  stderr: ${data}`);
                        });
                        restart.on('close', (code) => {
                            console.log(`restart ${restart.spawnargs} :  ${code}`);
                        })
                    })
                }
                setTimeout(() => {
                    ask();
                }, 2000);
                process.stdin.on("data", function(data) {
                    if (data.toString().trim() === "y")
                        regenerateCert();
                    else if (data.toString().trim() === "n")
                        process.exit(1)
                    else
                        ask();
                });

                function ask() {
                    process.stdout.write("Do you like to regenerate certificates  (y/n)?");
                }


            } else {
                console.log("LXD Certificate valid ")
            }
        })
    })
}

isCertificateValid()


let socketURL
if (config.server.secure) {
    socketURL = `https://${config.server.ip}:${config.server.port}`
} else {
    socketURL = `http://${config.server.ip}:${config.server.port}`
}

console.log(`socketURL => ${socketURL}`);

const socketOptions = {
    transports: ['websocket'],
    'force new connection': true,
    secure: config.server.secure,

    query: {
        token: 'cf29386d4478b579d37db9d67ec3ae6694cfb00953446bcda4554870ec527df86425997ac98b6f8e526584a00b83a24177b1e43b6824e3c7fb78aa8a1b779304e69b4436d2a5d1dfb7dcc287b5de9e66e66a221aa70dc24516d123de52a929022347f3beee9a97a06668515bb6409a890c17754e397b620cd3b5c1a11100786bc5c2ca1c4f9e3f82a9490fa028fe1e1725bfde4a725e3dd32cd94abed48500e1eb6be50c2a6163918d538cc4ab02859b28ed36cb837cf7506b63b9513d9e40a2'
    }
}

//const client = io.connect(socketURL, socketOptions)
const client = io.connect(socketURL, { secure: true, "rejectUnauthorized": false });
setIOClient(client)


function onJoin(data) {
    console.log(" onJoin  = " + data);
    deviceInfo_c();
}

client.on('connect', () => {
    console.log("Device connected ")
        // client.emit('register', config.myDeviceName, null)
    console.log('addr: ' + require("ip").address());
    client.emit('join', config.userName, config.deviceName, config.lxdTrustPassword, require("ip").address(), onJoin);



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





client.on('lxd_containerCreate', message => {
    console.log(`lxd_containerCreate :${JSON.stringify(message)}`)
    lxd_containerCreate_c(message)
})


client.on('message', message => {
    console.log(" massage => ");
    console.log(message);
    // switch (message.payload.type) {
    switch (message.payload.type) {

        case "isServiceAvailable":
            console.log('type isServiceAvailable');
            isServiceAvailable_c(message);
            break;

        case "isDeviceAvailable":
            console.log('type isDeviceAvailable');
            //TODO
            break;

        case "cleaning":
            console.log('type cleaning');
            cleaning_c(message);
            break;

        case "download":
            console.log('type download');
            downloadContainer_c(message);
            break;

        case "downloadNew":
            console.log('type downloadNew');
            downloadNew_c(message);
            break;

        case "config":
            console.log('type config');
            config_c(message)
            break;

        case "preStartConfig":
            console.log('type preStartConfig');
            preStartConfig_c(message)
            break;

        case 'startContainer':
            console.log('type startContainer');
            startContainer_c(message);
            break;

        case 'startContainerNew':
            console.log('type startContainer');
            startContainerNew_c(message);
            break;

        case "postStartConfig":
            console.log('type postStartConfig');
            postStartConfig_c(message)
            break;

        case 'status':
            console.log('type status');
            getStatusOfAllContainer_c();
            break;

        case 'containersStatus':
            console.log('type containersStatus');
            if (config.containerType == "lxd") {
                lxd_getStatusOfContainers_c(message)
            } else {
                getStatusOfContainers_c(message);
            }
            break;

        case "startExistingContainer":
            console.log('type startExistingContainer');
            startExistingContainer_c(message);
            break;

        case 'stopExistingContainer':
            console.log('type stopExistingContainer');
            stopExistingContainer_c(message);
            break;

        case 'deleteExistingContainer':
            console.log('type deleteExistingContainer');
            deleteExistingContainer_c(message);
            break;


        default:
            break;
    }
})