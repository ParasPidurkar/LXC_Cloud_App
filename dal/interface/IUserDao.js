
module.exports = class IUserDao {

    constructor() {
      if (this.constructor == IUserDao) {
        throw new Error("Abstract classes can't be instantiated.");
      }
    }
  
    say() {
      throw new Error("Method 'say()' must be implemented.");
    }
  
    eat() {
      console.log("eating");
    }

  }