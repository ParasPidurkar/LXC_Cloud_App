const IDeviceDao = require('./interface/IDeviceDao');

let instance
module.exports = class DeviceDao extends IDeviceDao {
    constructor(db, LXDRest) {
        super()
        this.db = db;
        this.LXDRest =LXDRest;
    }

    async init() {
        await this.cleanOldState();
    }

    async cleanOldState() {
        return new Promise(async (resolve, reject) => {
            try {
                //clean old states if any required
                await this.cleanOldStateDeviceStatus()
                resolve({ returnValue: true })
            } catch (error) {
                reject(error)
            }
        })
    }



    async cleanOldStateDeviceStatus() {
        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE containerInfo SET containerStatus = 'disconnected', services = '{}'`,
                function (err) {
                    if (err)
                        reject(err);
                    else {
                        console.log("All device disconnected (cleanOldStateDeviceStatus)");
                        resolve({ returnValue: true })
                    }
                });
        })
    }





    async onJoinStatusUpdate(userName, deviceName) {
        return new Promise((resolve, reject) => {
            try {

                this.db.run(`INSERT INTO "deviceInfo" ("deviceId", "userId", "deviceStatus", "errors") VALUES ('${deviceName}', '${userName}', 'connected', '{}') ON CONFLICT("deviceId") DO UPDATE SET "deviceStatus" = 'connected', userId = "${userName}";`,
                    function (err) {
                        if (err) {
                            throw err
                        }
                        console.log("devicename:", deviceName);
                        console.log("entry added to table");
                        resolve({returnValue:true})

                    });

            } catch (error) {
                reject({ 500: error.message })
            }
        })
    }



    // template
    //async (){
    // return new Promise((resolve, reject) => {
    //     try {

    //     } catch (error) {
    //         reject(error)
    //     }
    // })
    // }

    async test() {
        console.log("image dao test")
    }



    static async getInstance(db, LXDRest) {
        if (!instance) {
            instance = await new DeviceDao(db, LXDRest)
            await instance.init()
        }
        return instance
    }

}