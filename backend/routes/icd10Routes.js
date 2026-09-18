const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { searchIcd10, getIcd10Populer } = require("../controllers/icd10Controller");

router.use(auth);

router.get("/populer", getIcd10Populer);
router.get("/search", searchIcd10);

module.exports = router;
