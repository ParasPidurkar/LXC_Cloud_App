module.exports = class IDeviceDao {

    constructor() {
      if (this.constructor == IDeviceDao) {
        throw new Error("Abstract classes can't be instantiated.");
      }
    }
  
    updateExportState(state, imageName) {
        throw new Error("Method 'updateExportState()' must be implemented.");
    }
  

  }