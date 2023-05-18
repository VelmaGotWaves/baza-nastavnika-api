const express = require('express');
const router = express.Router();
const aneksiController = require('../../controllers/aneksiController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');
const fileUpload = require('express-fileupload')

router.route('/:id')
    .get(aneksiController.getAllAneksi)
    // .put(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), aneksiController.updateAllAneksi) ovo mi ne treba zato sto moze samo kombinacija delete i post
    .post(fileUpload({ createParentPath: true }),verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), aneksiController.createNewAneks)
    .delete(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), aneksiController.deleteAllAneksi);

router.route('/:id/:name')
    .get(aneksiController.getAneks)
    .delete(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), aneksiController.deleteAneks);
module.exports = router;

// PREBACI SVE CIGANE SA PARAMS NA JEBENI BODY U PICKU MATERINU, moze idalje da bude /:id samo nemoj da ga iskoristis u kodu i to je sve jbt