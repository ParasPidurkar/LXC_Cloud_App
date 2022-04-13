module.exports = class IContainerDao {

    constructor() {
      if (this.constructor == IContainerDao) {
        throw new Error("Abstract classes can't be instantiated.");
      }
    }
  
    // updateExportState(state, imageName) {
    //     throw new Error("Method 'updateExportState()' must be implemented.");
    // }
  

  }