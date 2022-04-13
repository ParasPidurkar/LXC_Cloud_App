const IImageDao = require('./interface/IImageDao');
// const LXDRest = require('../bll/lxc').getInstance();

let instance
module.exports = class ImageDao extends IImageDao {
    constructor(db, LXDRest) {
        console.log("ImageDao")

        super()
        this.db = db;
        this.LXDRest = LXDRest;
        this.LXDRest.test();
    }

    async init() {
        await this.cleanOldState();
    }

    async cleanOldState() {
        return new Promise(async (resolve, reject) => {
            try {
                //clean old states if any required
                resolve({ returnValue: true })
            } catch (error) {
                reject(error)
            }
        })
    }

    async updateExportState(state, imageName) {
        return new Promise(async (resolve, reject) => {
            var query = `UPDATE imageConfig set publish = ${state} WHERE name = "${imageName}" ;`
            console.log(query)
            this.db.run(query,
                function (err) {
                    if (err) {
                        reject(err)
                    }
                    console.log("entry updated to table");
                    resolve({ returnValue: true })
                });
        })
    }

    getImageConfigInfo(imageName, callback) {
        console.log("getImageConfigInfo")
        console.log(`SELECT ic.*, ics.description FROM imageConfig ic, imageCreationStatus ics where ic.status = ics.id AND ic.name = "${imageName}";`)
        this.db.all(`SELECT ic.*, ics.description FROM imageConfig ic, imageCreationStatus ics where ic.status = ics.id AND ic.name = "${imageName}";`,
            (error, rows) => {
                // receives all the results as an array
                // console.log("...........................SELECT * FROM containerHub;")
                console.log(rows);
                callback(rows)
            });
    
    }
    //update with Promise
    getUsedImageNames(callback) {

        console.log("getUsedImageNames")
        console.log(`WITH split(one, many, str) AS (
        SELECT name, '', name||'/' FROM containerHub
        UNION ALL SELECT one,
        substr(str, 0, instr(str, '/')),
        substr(str, instr(str, '/')+1)
        FROM split WHERE str !=''
    ) SELECT many FROM split WHERE many!='' UNION SELECT name from imageConfig`)

        this.db.all(`
        WITH split(one, many, str) AS (
            SELECT name, '', name||'/' FROM containerHub
            UNION ALL SELECT one,
            substr(str, 0, instr(str, '/')),
            substr(str, instr(str, '/')+1)
            FROM split WHERE str !=''
        ) SELECT many FROM split WHERE many!='' UNION SELECT name from imageConfig`,
            (error, rows) => {
                // receives all the results as an array
                console.log("...........................SELECT * FROM containerHub;")
                console.log(rows);
                callback(rows)
            });


    }

    getUserImageConfigInfo(userName, callback) {
        console.log("getUserImageConfigInfo")
        console.log(`SELECT ic.*, ics.description FROM imageConfig ic, imageCreationStatus ics where ic.status = ics.id AND ic.userId = "${userName}";`)
        this.db.all(`SELECT ic.*, ics.description FROM imageConfig ic, imageCreationStatus ics where ic.status = ics.id AND ic.userId = "${userName}";`,
            (error, rows) => {
                // receives all the results as an array
                // console.log("...........................SELECT * FROM containerHub;")
                console.log(rows);
                callback(rows)
            });

    }

    getImagesInfo(callback, ip = null) {
        console.log("getImagesInfo ip = " + ip)

        var rows = [];

        this.LXDRest.imagesInfo((data) => {
            if (data != null) {
                console.log("..............ans ")
                console.log(data)
                var array = Object.keys(data)
                for (let index = 0; index < array.length; index++) {
                    const element = array[index];
                    var name = element.split("/")[element.split("/").length - 1];
                    var sqlQuery = `select ic.serviceSupport, ic.deviceSupport, ic.deviceType, ic.publish from 
            imageConfig ic where ic.name = "${name}" `

                    console.log(sqlQuery)
                    this.db.each(sqlQuery,
                        (error, row) => {
                            console.log(row);
                            row.detail = data[element];
                            row.name = element;
                            row.architecture = data[element].properties.architecture;
                            row.description = data[element].properties.description;
                            row.os = data[element].properties.os;
                            rows.push(row);
                        },
                        (err, numberOfRows) => {
                            if (err) {
                                console.error(err.message);
                            }

                            if (numberOfRows == 0) {
                                var row = {};
                                row.serviceSupport = null;
                                row.deviceSupport = null;
                                row.deviceType = null;
                                row.detail = data[element];
                                row.name = element;
                                row.architecture = data[element].properties.architecture;
                                row.description = data[element].properties.description;
                                row.os = data[element].properties.os;
                                rows.push(row);
                            }
                            console.log(`....................There were ${numberOfRows} containers`);
                            // console.log(tempUserMap)
                            console.log(rows)
                            if (rows.length == array.length)
                                callback(rows);
                        });

                }
                if (array.length == 0) {
                    callback(rows);
                }
            } else {
                callback({})
            }
        }, ip)
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



    static async getInstance(db,LXDRest) {
        if (!instance) {
            instance = await new ImageDao(db, LXDRest)
            await instance.init()
        }
        return instance
    }

}