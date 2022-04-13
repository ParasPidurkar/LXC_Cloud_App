'use strict';

module.exports = class User {
    constructor(data) {
        this.userId = data.userId
        this.firstName = data.firstName
        this.lastName = data.lastName
        this.email = data.email
    }

    test() {
        console.log("test")
    }
}

// var myUser = new User({ userId: "aj", firstName: "a", lastName: "j", email: "aj@gmail.com" })

// console.log(JSON.stringify(myUser));
// myUser.test()
// console.log(myUser.userId)
// console.log(myUser);