const def = require('../common/def');


let instance = null


class DBManager {

    constructor(dbtype) {
        console.log("LXDRest constructor")
        switch (dbtype) {
            case "SQLite":
                this.initSQLite();
                break;
        
            default:
                throw new Error(`error: Provided database (${dbtype}) not supported `);
                
        }

    }

    initSQLite(){
        console.log("initSQLite")
    }
    test(){
        console.log("test")
    }
    // dbtype : "SQLite"
    static getInstance(dbtype) {
        if (!instance) {
            instance = new DBManager(dbtype)
        }

        return instance
    }
}

var dbm  = DBManager.getInstance("SQLite")
dbm.test();
console.log(def.exportState.SUCCESS)

// module.exports = LXDRest
