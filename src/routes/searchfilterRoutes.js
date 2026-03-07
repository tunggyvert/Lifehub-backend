const express = require('express');
const router = express.Router();

const searchfilterController = require('../controllers/searchfilterControllers');

router.get('/', searchfilterController.getnearby);

module.exports = router;