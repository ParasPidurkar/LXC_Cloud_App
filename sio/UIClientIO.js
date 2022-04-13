
module.exports = class UIClientIO {
    constructor(io,socket) {
        this.io = io;
        this.socket = socket;
    }

    async init() {
        
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