// import IUserDao from './IUserDao';

const IUserDao = require('./interface/IUserDao');
const { retry } = require('async');


let instance
module.exports = class UserDao extends IUserDao {
    constructor(db, LXDRest) {
        console.log("UserDao CTOR" )
        super()
        this.db = db;
        this.LXDRest = LXDRest;

    }

    async init() {
        await this.cleanOldState();
    }
    async cleanOldState() {
        return new Promise(async (resolve, reject) => {
            try {
                // await this.cleanOldStateDeviceStatus()
                // await this.cleanOldStateContainerInfo()


                resolve({ returnValue: true })
            } catch (error) {
                reject(error)
            }
        })
    }




    getUserData(userName, callback) {
        var tempUserMap = {}
        var info = {}
        var settings = {}

        this.db.each(`
    with user as (
      select * from userInfo where userId = "${userName}"
    )
    select
      ic.serviceSupport, ic.deviceSupport, c.type, user.userId, user.firstName, user.lastName, user.email , user.faceId, d.deviceStatus, d.deviceId,  d.deviceInfo,
      c.containerName, c.profile, c.type, c.containerStatus,
      c.runningDetails, c.info, c.configStatusCode, c.services, c.configDescription,
      b.bcolor, b.fsize, b.fcolor, b.bimage ,b.headfsize ,b.headfcolor,b.subheadfsize ,b.subheadfcolor,b.cardfsize ,b.cardfcolor,b.headcardfsize ,b.headcardfcolor, b.sidebarfsize, b.sidebarfcolor,b.sidebarbackcolor, b.sidebarheadfsize, b.sidebarheadfcolor
    from
      user
      left join deviceInfo d on user.userId = d.userId
      left join containerInfo c on d.deviceId = c.deviceId
      left join userSettings b on user.userId = b.userId
	  left join containerHub ch on ch.name = c.type 
	  left join imageConfig ic on ch.name = 'webosose/1.0/armhf/'||ic.name `,
            //left join containerInfo c on user.userId = c.userId
            (err, row) => {
                if (err) {
                    console.error(err.message);
                }
                // console.log(row);
                // tempUserMap[row.userId] = tempUserMap[row.userId] || {};
                settings = { backCol: row.bcolor, backImg: row.bimage, fontSize: row.fsize, fontColor: row.fcolor, headfontSize: row.headfsize, headfontColor: row.headfcolor, subheadfontSize: row.subheadfsize, subheadfontColor: row.subheadfcolor, cardfontSize: row.cardfsize, cardfontColor: row.cardfcolor, headcardfontSize: row.headcardfsize, headcardfontColor: row.headcardfcolor, sidebarfontSize: row.sidebarfsize, sidebarfontColor: row.sidebarfcolor, sidebarbackColor: row.sidebarbackcolor, sidebarheadfontSize: row.sidebarheadfsize, sidebarheadfontColor: row.sidebarheadfcolor };
                //console.log("setting =")
                //console.log(settings)
                if (info.userInfo == undefined)
                    info.userInfo = { userId: row.userId, firstName: row.firstName, lastName: row.lastName, email: row.email };
                if (row.deviceId != undefined && !tempUserMap.hasOwnProperty(row.deviceId)) {
                    info[row.deviceId] = {};
                    info[row.deviceId].deviceInfo = JSON.parse(row.deviceInfo);
                    info[row.deviceId].deviceStatus = row.deviceStatus;
                    console.log("device id is working")
                    tempUserMap[row.deviceId] = tempUserMap[row.deviceId] ? tempUserMap[row.deviceId] : {};
                }
                if (row.containerName != undefined) {
                    console.log("container is working")
                    tempUserMap[row.deviceId][row.containerName] = {
                        containerName: row.containerName,
                        profile: row.profile,
                        type: row.type,
                        containerStatus: row.containerStatus,
                        runningDetails: row.runningDetails,
                        info: row.info,
                        configStatusCode: row.configStatusCode,
                        services: JSON.parse(row.services),
                        configDescription: row.configDescription
                    };
                    if (row.runningDetails != undefined) {
                        console.log("checking the errors");
                        tempUserMap[row.deviceId][row.containerName].runningDetails = JSON.parse(row.runningDetails);
                    }
                    if (row.serviceSupport != undefined && row.serviceSupport != null) {
                        console.log("checking the serviceSupport");
                        tempUserMap[row.deviceId][row.containerName].serviceSupport = JSON.parse(row.serviceSupport);
                    }

                    if (row.deviceSupport != undefined && row.deviceSupport != null) {
                        console.log("checking the deviceSupport");
                        tempUserMap[row.deviceId][row.containerName].deviceSupport = JSON.parse(row.deviceSupport);
                    }
                }
            },
            (err, numberOfRows) => {
                if (err) {
                    console.error(err.message);

                }
                console.log(`There were ${numberOfRows} containers`);
                // console.log(tempUserMap)
                // console.log(JSON.stringify(tempUserMap))

                callback(tempUserMap, info, settings);
            }
        );

    }

    async checkUserCredentials(userId, pass) {

        // db.get('SELECT salt FROM users WHERE username = ?', username, function (err, row) {
        //     if (!row) return done(null, false);
        //     var hash = hashPassword(password, row.salt);
        //     db.get('SELECT username, id FROM users WHERE username = ? AND password = ?', username, hash, function (err, row) {
        //         if (!row) return done(null, false);
        //         return done(null, row);
        //     });
        // });

        return new Promise((resolve, reject)=>{
            this.db.get(`SELECT * FROM userInfo WHERE userId = "${userId}" AND password = "${pass}"`, function (err, row) {
                if(err) reject(err)
                resolve(row)
            });

        })
       

        // 

        // return new Promise((resolve, reject) => {
        //     try {

        //         db.each(`SELECT *
        //              FROM userInfo WHERE userId = "${req.body.userName}" AND password = "${req.body.pass}"`, (err, row) => {
        //             if (err) {
        //                 console.error(err.message);
        //                 data = { error: "Username or password not match." };
        //                 res.render('login', { data: data });
        //             }
        //             //console.log(row.userId);
        //             console.log("-----select userId and password-------");
        //             console.log(row);
        //             if (row != undefined && row.userId) {
        //                 var hour = 3600000
        //                 req.session.cookie.expires = new Date(Date.now() + hour);
        //                 req.session.cookie.maxAge = hour;
        //                 req.user = req.body.userName;
        //                 res.redirect('/index');
        //             } else {
        //                 data = { error: "Username or password not match." };
        //                 res.render('login', { data: data });
        //             }
        //         },
        //             (err, numberOfRows) => {
        //                 if (err) {
        //                     console.error(err.message);
        //                     data = { error: "Username or password not match." };
        //                     res.render('login', { data: data });

        //                 }

        //                 console.log(`There were ${numberOfRows} containers`);
        //                 if (numberOfRows == 0) {
        //                     data = { error: "Username or password not match." };
        //                     res.render('login', { data: data });
        //                 }

        //             }
        //         );

        //     } catch (error) {
        //         reject(error)
        //     }
        // })


    }

    async getUser(userId){
        return new Promise((resolve, reject)=>{
            this.db.get(`SELECT * FROM userInfo WHERE userId = "${userId}"`, function (err, row) {
                // if(err) reject(err)
                resolve(row)
            });

        })
    }

    // return new Promise((resolve, reject) => {
    //     try {

    //     } catch (error) {
    //         reject(error)
    //     }
    // })

    async test() {
        console.log("User dao test")
    }

    getUserData(userName, callback) {
        var tempUserMap = {}
        var info = {}
        var settings = {}
    
        this.db.each(`
        with user as (
          select * from userInfo where userId = "${userName}"
        )
        select
          ic.serviceSupport, ic.deviceSupport, c.type, user.userId, user.firstName, user.lastName, user.email , user.faceId, d.deviceStatus, d.deviceId,  d.deviceInfo,
          c.containerName, c.profile, c.type, c.containerStatus,
          c.runningDetails, c.info, c.configStatusCode, c.services, c.configDescription,
          b.bcolor, b.fsize, b.fcolor, b.bimage ,b.headfsize ,b.headfcolor,b.subheadfsize ,b.subheadfcolor,b.cardfsize ,b.cardfcolor,b.headcardfsize ,b.headcardfcolor, b.sidebarfsize, b.sidebarfcolor,b.sidebarbackcolor, b.sidebarheadfsize, b.sidebarheadfcolor
        from
          user
          left join deviceInfo d on user.userId = d.userId
          left join containerInfo c on d.deviceId = c.deviceId
          left join userSettings b on user.userId = b.userId
          left join containerHub ch on ch.name = c.type 
          left join imageConfig ic on ch.name = 'webosose/1.0/armhf/'||ic.name `,
            //left join containerInfo c on user.userId = c.userId
            (err, row) => {
                if (err) {
                    console.error(err.message);
                }
                // console.log(row);
                // tempUserMap[row.userId] = tempUserMap[row.userId] || {};
                settings = { backCol: row.bcolor, backImg :row.bimage, fontSize: row.fsize ,fontColor: row.fcolor ,headfontSize: row.headfsize, headfontColor: row.headfcolor,subheadfontSize: row.subheadfsize, subheadfontColor: row.subheadfcolor   ,cardfontSize: row.cardfsize, cardfontColor: row.cardfcolor,headcardfontSize: row.headcardfsize, headcardfontColor: row.headcardfcolor ,sidebarfontSize: row.sidebarfsize, sidebarfontColor: row.sidebarfcolor, sidebarbackColor: row.sidebarbackcolor,sidebarheadfontSize: row.sidebarheadfsize, sidebarheadfontColor: row.sidebarheadfcolor};
                //console.log("setting =")
                //console.log(settings)
                if (info.userInfo == undefined)
                    info.userInfo = { userId: row.userId, firstName: row.firstName, lastName: row.lastName, email: row.email };
                if (row.deviceId != undefined && !tempUserMap.hasOwnProperty(row.deviceId)) {
                    info[row.deviceId] = {};
                    info[row.deviceId].deviceInfo = JSON.parse(row.deviceInfo);
                    info[row.deviceId].deviceStatus = row.deviceStatus;
                    console.log("device id is working")
                    tempUserMap[row.deviceId] = tempUserMap[row.deviceId] ? tempUserMap[row.deviceId] : {};
                }
                if (row.containerName != undefined) {
                    console.log("container is working")
                    tempUserMap[row.deviceId][row.containerName] = {
                        containerName: row.containerName,
                        profile: row.profile,
                        type: row.type,
                        containerStatus: row.containerStatus,
                        runningDetails: row.runningDetails,
                        info: row.info,
                        configStatusCode: row.configStatusCode,
                        services: JSON.parse(row.services),
                        configDescription: row.configDescription
                    };
                    if (row.runningDetails != undefined) {
                        console.log("checking the errors");
                        tempUserMap[row.deviceId][row.containerName].runningDetails = JSON.parse(row.runningDetails);
                    }
                    if (row.serviceSupport != undefined && row.serviceSupport != null) {
                        console.log("checking the serviceSupport");
                        tempUserMap[row.deviceId][row.containerName].serviceSupport = JSON.parse(row.serviceSupport);
                    }
    
                    if (row.deviceSupport != undefined && row.deviceSupport != null) {
                        console.log("checking the deviceSupport");
                        tempUserMap[row.deviceId][row.containerName].deviceSupport = JSON.parse(row.deviceSupport);
                    }
                }
            },
            (err, numberOfRows) => {
                if (err) {
                    console.error(err.message);
    
                }
                console.log(`There were ${numberOfRows} containers`);
                // console.log(tempUserMap)
                // console.log(JSON.stringify(tempUserMap))
    
                callback(tempUserMap, info, settings);
            }
        );
    
    }
    


    static async getInstance(db, LXDRest) {
        if (!instance) {
            instance = await new UserDao(db, LXDRest)
            await instance.init()
        }

        return instance
    }

}