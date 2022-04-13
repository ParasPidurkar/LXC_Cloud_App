let LXDRest;
let dbm;
let def = require('../common/def');
let config = require('getconfig');

/**
 * 
 * @param req.body.data.device Device name from which image need to be exported.
 * @param req.body.data.fingerprint fingerprint of image need to be exported. 
 * 
 */
const exportImage = (req, res) => {
  try {
    console.log("export post method");
    console.log(req.body)
    LXDRest.test()
    LXDRest.exportImage(
      req.body.data.fingerprint,
      req.body.data.device,
      config.lxdImageServer.name
    ).then(function (response) {
      if (response.returnValue) {
        dbm.imageDao.updateExportState(def.exportState.SUCCESS, req.body.data.imageName)
      } else {
        dbm.imageDao.updateExportState(def.exportState.FAIL, req.body.data.imageName)
      }
      console.log(response)
      res.json(response);
    }).catch(function (e) {
      console.log(e);
      res.json(e);
    });

  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
}


/**
 * 
 * @param req.body.data.device Device name from which image need to be deleted.
 * @param req.body.data.fingerprint fingerprint of image need to be deleted. 
 * 
 */

const deleteImage = (req, res) => {
  try {
    console.log("deleteImage method");
    console.log(req.params)
    LXDRest.deleteImage(
      req.params.fingerprint,
      req.params.deviceName
    ).then(function (response) {
      console.log(response)
      res.json(response);
    }).catch(function (e) {
      console.log(e);
      res.json(e);
    });

  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
}



/**
 * 
 * @param req.params.deviceName Device name from which image list required.
 * 
 */

const listImage = (req, res) => {
  try {
    console.log(" get image list fpr device = "+req.params.deviceName);
    console.log(req.body)
    console.log(req.params)
    console.log(req.query)
    LXDRest.listImage(
      req.params.deviceName
    ).then(function (response) {
      console.log(response)
      res.json(response);
    }).catch(function (e) {
      console.log(e);
      res.json(e);
    });

  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
}




const setDependency = async(dbm_,LXDRest_)=>{
  console.log("controller image setDependency")
  dbm = dbm_;
  LXDRest = LXDRest_
  LXDRest.test()
}

const test = (req, res) => { res.json({ test: "test" }); }



module.exports = {
  exportImage,
  deleteImage,
  setDependency,
  listImage,
  test
};