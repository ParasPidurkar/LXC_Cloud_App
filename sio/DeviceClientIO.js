// const DBManager = require("../dal/DBManager");
const config = require('getconfig');
let db;
let LXDRest
let io
let dbm
module.exports = class DeviceClientIO {
    constructor(io_, socket, dbm_,LXDRest_) {
        console.log("DeviceClientIO CTOR ")
        io = io_;
        this.socket = socket;
        db = dbm_.db;
        dbm = dbm_
        LXDRest = LXDRest_;
        LXDRest.test();
    }

    async init(userName, deviceName, lxdTrustPassword, ip, cb) {
        dbm.deviceDao.onJoinStatusUpdate(userName, deviceName).catch((msg)=>{console.log(msg)})
        console.log("new device join userName =>" + userName + " deviceName => " + deviceName +
            "  lxdTrustPassword = >" + lxdTrustPassword + " ip => " + ip);
        LXDRest.checkRemoteDeviceAdded(deviceName, ip, lxdTrustPassword, () => { })
        if (typeof userName !== 'string') return;
        // check if maximum number of clients reached
        if (config.rooms && config.rooms.maxClients > 0 &&
            clientsInRoom(userName) >= config.rooms.maxClients) {
            safeCb(cb)('full');
            return;
        }
        if (this.socket.rooms.has(deviceName)) {
            console.log('Device Name already registered. Please update device name.')
            safeCb(cb)('Device Name already registered. Please update device name.');
        }

        console.log(",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,")
        this.listen()
    }

    listen(){
        
        this.socket.on('startExistingContainer', function (details) {
            console.log(" startExistingContainer callback ");
            // userMap[details.to][details.from][details.data.containerName] = details.data;

        });

        this.socket.on('stopExistingContainer', function (details) {
            console.log(" stopExistingContainer callback ");
            // userMap[details.to][details.from][details.containerName] = details.data;
        });

        this.socket.on('deleteExistingContainer', function (details) {
            console.log(" deleteExistingContainer callback ");
            // const o = { lastName: 'foo' }
            if (userMap[details.to][details.from].hasOwnProperty(details.containerName))
                delete userMap[details.to][details.from][details.containerName];
            else {
                console.log("Not able to find container entry ")
                console.log(details)
                console.log(userMap[details.to])
            }

            console.log(userMap[details.to][details.from])

        });

        this.socket.on('lxd_statusUpdate', function (message, deviceId) {
            console.log("lxd_statusUpdate");
            console.log(message)

            Object.keys(message).forEach((name) => {
                console.log("deviceName" + deviceId + " name  = " + name);
                if (message[name].type != "error") { //||!message.hasOwnProperty("error")) {
                   dbm.containerDao.updateContainerStatus(deviceId,name,message[name], message[name].metadata.status )
                } else {
                    console.log("Check the error container might be delete")

                    db.run(`DELETE FROM containerInfo WHERE deviceId = "${deviceId}" AND containerName = "${name}";`,
                        function (err) {
                            if (err) {
                                return console.log(err.message);
                            }

                            console.log("entry deleted from table containerInfo deviceId = " + deviceId + " containerName = " + name);
                        });
                }

            })


        });

    }

    // return new Promise((resolve, reject) => {
    //     try {

    //     } catch (error) {
    //         reject(error)
    //     }
    // })

    async test() {
        console.log("test")
    }
}