const express = require("express");
const router = express.Router();
const controllerImage = require("../controller/controller.image.js");

var itemRouter = express.Router({mergeParams: true});
router.use('/:userId/items', itemRouter);

itemRouter.route('/')
    .get(function (req, res) {
        res.status(200)
            .send('hello items from user ' + req.params.userId);
    });


let routes = async(app, pass, dbm, io, LXDRest) => {
  console.log("image route")
  LXDRest.test()
  await controllerImage.setDependency(dbm, LXDRest);
  router.post("/upload", () => { });
  router.get("/image", (req, res) => { res.json({ test: "test" }); });
  router.get("/test",controllerImage.test );
  
  router.post('/export', controllerImage.exportImage)
  router.get('/list/:deviceName', controllerImage.listImage)
  router.delete('/remove/:deviceName/:fingerprint', controllerImage.deleteImage)
  //   router.get("/files", controller.getListFiles);
  //   router.get("/files/:name", controller.download);

  app.use("/images",router);
};

module.exports = routes;
