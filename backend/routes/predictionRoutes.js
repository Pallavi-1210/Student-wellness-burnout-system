const express = require("express");

const router = express.Router();

// AS predictburonut controller ke andr h soo import it
const { predictBurnout } = require("../controllers/predictionController");

router.post("/predict", predictBurnout);

module.exports = router;
