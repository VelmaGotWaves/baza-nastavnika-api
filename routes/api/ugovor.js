const express = require('express');
const router = express.Router();
const ugovorController = require('../../controllers/ugovorController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');
const fileUpload = require("express-fileupload");

router.route('/:id')
    .get(ugovorController.getUgovor)
    .post(fileUpload({ createParentPath: true }),verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), ugovorController.updateUgovor)
    .delete(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), ugovorController.deleteUgovor);



module.exports = router;

// PREBACI SVE CIGANE SA PARAMS NA JEBENI BODY U PICKU MATERINU, moze idalje da bude /:id samo nemoj da ga iskoristis u kodu i to je sve jbt