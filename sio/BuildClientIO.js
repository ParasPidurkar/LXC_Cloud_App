// const dbManager = require("../dal/DBManager").getInstance()

let dbm;
let LXDRest
module.exports = class BuildClientIO {
    constructor(io,socket,  dbm_ ,LXDRest_) {
        console.log("BuildClientIO CTOR")
        this.io = io;
        this.socket = socket;
        dbm = dbm_;
        LXDRest = LXDRest_;
        dbm.test()

    }

    async init(config, cb) {    
        dbm.buildConfigDao.onJoinStatusUpdate(config.id,config.ip)
        console.log(",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,")
        console.log(config)
        this.socket.join("imageBuilder");
        this.socket.config = config;
        this.socket.serverid = config.id;
        //this.socket.room = deviceName;
        // safeCb(cb)('build client registered successfully.');
        this.startListen()
    }

    async startListen(){
        
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