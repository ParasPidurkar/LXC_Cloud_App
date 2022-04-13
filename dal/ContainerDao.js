const IContainerDao = require('./interface/IContainerDao');

let instance
module.exports = class ContainerDao extends IContainerDao {
    constructor(db, LXDRest) {
        super()
        this.db = db;
        this.LXDRest= LXDRest;
    }

    async init() {
        await this.cleanOldState();
    }

    async cleanOldState() {
        return new Promise(async (resolve, reject) => {
            try {
                //clean old states if any required
                await this.cleanOldStateContainerInfo();
                resolve({ returnValue: true })
            } catch (error) {
                reject(error)
            }
        })
    }

    
    async cleanOldStateContainerInfo() {
        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE containerInfo SET containerStatus = 'disconnected', services = '{}'`,
                function (err) {
                    if (err)
                        reject(err);
                    else {
                        console.log("All container disconnected (cleanOldStateContainerInfo)");
                        resolve({ returnValue: true })
                    }
                });
        })
    }


    
    async getContainerOfDevice(deviceName) {
        return new Promise((resolve, reject) => {
            try {
                this.db.all(`SELECT containerName FROM containerInfo WHERE deviceId = "${deviceName}";`,
                    (error, rows) => {
                        if (err) {
                            reject({ 500: error.message })
                        }
                        // receives all the results as an array
                        console.log("........................... after Join containerName")
                        console.log(rows);
                        socket.emit("message", { payload: { type: "containersStatus", contArr: rows } });
                        resolve({ returnValue: true })
                    });
            } catch (error) {
                reject(error)
            }
        })
    }


    async updateContainerStatus(deviceId, containerName, runningDetails, containerStatus ){
        var query = `UPDATE containerInfo set runningDetails = '${JSON.stringify(runningDetails)}', containerStatus = "${containerStatus}" WHERE containerName = "${containerName}" AND deviceId = "${deviceId}";`
        console.log(query)
        this.db.run(query,
            function (err) {
                if (err) {
                    return console.log(err.message);
                }
                console.log("entry updated to table");
            });
    }

    // return new Promise((resolve, reject) => {
    //     try {

    //     } catch (error) {
    //         reject(error)
    //     }
    // })

    async test() {
        console.log("image dao test")
    }



    static async getInstance(db, LXDRest) {
        if (!instance) {
            instance = await new ContainerDao(db, LXDRest)
            await instance.init()
        }
        return instance
    }

}