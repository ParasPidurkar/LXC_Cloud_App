const IBuildConfigDao = require('./interface/IBuildConfigDao');
const config = require('getconfig');
let instance

module.exports = class BuildConfigDao extends IBuildConfigDao {
    constructor(db ,LXDRest) {
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
                await this.cleanOldStateBuildConfig()
                resolve({ returnValue: true })
            } catch (error) {
                reject(error)
            }
        })
    }

    async cleanOldStateBuildConfig() {
        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE buildConfig SET Status = 'disconnected', serverInfo = '{}', Error = '{}'`,
                function (err) {
                    if (err)
                        reject(err);
                    else {
                        console.log("All Build Server disconnected (cleanOldStateBuildConfig)");
                        resolve({ returnValue: true })
                    }
                });
        })
    }


    async onJoinStatusUpdate(id, ip) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`INSERT INTO "buildConfig" ("serverId", "status", "serverInfo", "Error") VALUES ('${id}', 'connected', '${ip}','{}') ON CONFLICT("serverid") DO UPDATE SET "status" = 'connected', "serverInfo"='${ip}' where "serverid"='${id}';`);
                this.db.run(`INSERT INTO "buildConfig" ("serverId", "status", "serverInfo", "Error") VALUES ('${id}', 'connected', '${ip}','{}') ON CONFLICT("serverid") DO UPDATE SET "status" = 'connected', "serverInfo"='${ip}' where "serverid"='${id}';`,
                    function (err) {
                        if (err) {
                            // safeCb(cb)('Please update config = ' + config);
                            reject({500:err.message})
                            return console.log(err.message);
                        }
                        console.log("config:", config);
                        resolve({returnValue:true})
                        // safeCb(cb)('Build Server updated successfully.');
                        console.log("entry added to table");
        
                    });        
            } catch (error) {
                reject({500:error.message})
            }
        })
    }


    
    getbuildServerData(callback) {
        console.log("getbuildServerData")
        // console.log("SELECT * FROM containerHub;")
        var sqlQuery = `select bc.serverid, bc.status, bc.serverInfo from buildConfig bc `
        console.log(sqlQuery)
        var buildConfig = [];
        this.db.each(sqlQuery,
            (error, rows) => {
                if (error) {
                    console.error(error.message);
                }
                console.log(rows);
                //rows.detail = JSON.parse(rows.detail);
                buildConfig.push(rows);

            },
            (err, numberOfRows) => {
                if (err) {
                    console.error(err.message);
                }
                console.log(`There were ${numberOfRows} server`);

                callback(buildConfig);
            }
        );

    }



    // template
    // return new Promise((resolve, reject) => {
    //     try {

    //     } catch (error) {
    //         reject(error)
    //     }
    // })

    async test() {
        console.log("image dao test")
    }



    static async getInstance(db,LXDRest) {
        if (!instance) {
            instance = await new BuildConfigDao(db, LXDRest)
            await instance.init()
        }
        return instance
    }

}