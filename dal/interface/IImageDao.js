module.exports = class IImageDao {

    constructor() {
      if (this.constructor == IImageDao) {
        throw new Error("Abstract classes can't be instantiated.");
      }
    }
  
    updateExportState(state, imageName) {
        throw new Error("Method 'updateExportState()' must be implemented.");
    }
  

  }