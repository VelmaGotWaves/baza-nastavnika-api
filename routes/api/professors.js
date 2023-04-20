const express = require('express');
const router = express.Router();
const professorsController = require('../../controllers/professorsController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');

router.route('/')
    .get(professorsController.getAllProfessors)
    .post(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), professorsController.createNewProfessor)
    .patch(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), professorsController.updateProfessor)
    .delete(verifyRoles(ROLES_LIST.Admin), professorsController.deleteProfessor);

router.route('/:id')
    .get(professorsController.getProfessor);

module.exports = router;