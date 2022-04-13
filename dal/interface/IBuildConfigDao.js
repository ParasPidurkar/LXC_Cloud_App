module.exports = class IConfigDao {

    constructor() {
      if (this.constructor == IConfigDao) {
        throw new Error("Abstract classes can't be instantiated.");
      }
    }
  
    // updateExportState(state, imageName) {
    //     throw new Error("Method 'updateExportState()' must be implemented.");
    // }
  

  }