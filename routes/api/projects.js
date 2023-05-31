const express = require('express');
const router = express.Router();
const fileUpload = require("express-fileupload");

const projectsController = require('../../controllers/projectsController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');

router.route('/')
    .get(projectsController.getAllProjects)
    .post(fileUpload({ createParentPath: true }), verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), projectsController.createNewProject)
    .patch(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), projectsController.updateProject)
    .delete(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), projectsController.deleteProject);

router.route('/:id')
    .get(projectsController.getProject);

module.exports = router;