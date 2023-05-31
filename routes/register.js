const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');
const ROLES_LIST = require('../config/roles_list');
const verifyRoles = require('../middleware/verifyRoles');

router.post('/',verifyRoles(ROLES_LIST.Admin), registerController.handleNewUser);

module.exports = router;