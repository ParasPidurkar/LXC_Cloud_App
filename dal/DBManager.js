

// import UserDao from './UserDao';

const UserDao = require('./UserDao');
const ImageDao = require('./ImageDao');
const ContainerDao = require('./ContainerDao');
const BuildConfigDao = require('./BuildConfigDao');
const DeviceDao = require('./DeviceDao');

const { timeout } = require('async');
// const sqlite3 = require('sqlite3').verbose();

let instance = null
let stat = false


class DBManager {

    constructor() {
        console.log("DBManager constructor")
    }

    async init(db, LXDRest) {
        console.log("DBManager init")
        LXDRest.test();

        this.db = db;
        this.LXDRest = LXDRest;
        await this.initSQLite();

        // switch (dbtype) {
        //     case "SQLite":
        //         await this.initSQLite();
        //         break;

        //     default:
        //         throw new Error(`error: Provided database (${dbtype}) not supported `);

        // }
    }

    test() {
        console.log("dbmanager test")
    }

    async initSQLite() {

        // return new Promise((resolve, reject) => {
        // this.db = await new sqlite3.Database('../data/data.db', sqlite3.OPEN_READWRITE, (err) => {
        //     if (err) {
        //         console.error(err.message);
        //         // reject(err)
        //     }

        //     console.log('Connected to the data database.');
        //     // resolve({returnValue:true})
        // });

        this.userDao = await UserDao.getInstance(this.db, this.LXDRest)
        // this.userDao.test()
        this.imageDao = await ImageDao.getInstance(this.db, this.LXDRest)
        this.containerDao = await ContainerDao.getInstance(this.db, this.LXDRest)
        this.buildConfigDao =  await BuildConfigDao.getInstance(this.db, this.LXDRest)
        this.deviceDao =  await DeviceDao.getInstance(this.db, this.LXDRest)
        // })



    }
    // dbtype : "SQLite"
    static getInstance(db, LXDRest) {
        return new Promise(async (resolve, reject) => {
            if (!instance) {
                if (!stat && db) {
                    stat = true
                    instance = await new DBManager()
                    LXDRest.test();
                    await instance.init(db, LXDRest)
                    stat = false

                } else {
                    throw new Error(`error: Failed to instantiate DBManager possible reason (in-progress, unavailable dependency injection)  `);
                }
            }
            resolve(instance)

        })
    }
}



// (async ()=>{
// let dbmanager  = await DBManager.getInstance("SQLite")
// setTimeout(async () => {
// await dbmanager.userDao.test()
// console.log("test done")
// }, 2000);
// 
// })()

module.exports = DBManager
