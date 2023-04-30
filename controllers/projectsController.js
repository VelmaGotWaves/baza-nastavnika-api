const Project = require('../model/Project');

const getAllProjects = async (req, res) => {
    const projects = await Project.find();
    if (!projects) return res.status(204).json({ 'message': 'No project found.' });
    res.json(projects);
}

const createNewProject = async (req, res) => {
    if (!req?.body?.nazivProjekta) {
        return res.status(400).json({ 'message': 'Project name is required' });
    }

    try {
        const result = await Project.create({
            nazivProjekta: req.body.nazivProjekta,
            nazivPrograma: req.body.nazivPrograma,
            referentniBroj: req.body.referentniBroj
        });

        res.status(201).json(result);
    } catch (err) {
        console.error(err);
    }
}

const updateProject = async (req, res) => {
    if (!req?.body?.id) {
        return res.status(400).json({ 'message': 'ID parameter is required.' });
    }
    if(req.body.id.length != 24){
        return res.status(404).json({ "message": `No project matches ID ${req.body.id}.` });
    }
    const project = await Project.findOne({ _id: req.body.id }).exec();
    if (!project) {
        return res.status(204).json({ "message": `No project matches ID ${req.body.id}.` });
    }
    if (req.body?.nazivProjekta) project.nazivProjekta = req.body.nazivProjekta;
    if (req.body?.nazivPrograma) project.nazivPrograma = req.body.nazivPrograma;
    if (req.body?.referentniBroj) project.referentniBroj = req.body.referentniBroj;
    
    const result = await project.save();
    res.json(result);
}

const deleteProject = async (req, res) => {
    if (!req?.body?.id) return res.status(400).json({ 'message': 'Project ID required.' });
    if(req.body.id.length != 24){
        // console.log('nije24')
        return res.status(404).json({ "message": `No project matches ID ${req.body.id}.` });
    }
    const project = await Project.findOne({ _id: req.body.id }).exec();
    if (!project) {
        return res.status(404).json({ "message": `No project matches ID ${req.body.id}.` });
    }
    const result = await project.deleteOne(); //{ _id: req.body.id }
    res.json(result);
}

const getProject = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ 'message': 'Project ID required.' });
    if(req.body.id.length != 24){
        return res.status(404).json({ "message": `No project matches ID ${req.body.id}.` });
    }
    const project = await Project.findOne({ _id: req.params.id }).exec().catch(console.error);
    if (!project) {
        return res.status(404).json({ "message": `No project matches ID ${req.params.id}.` });
    }
    res.json(project);
}

module.exports = {
    getAllProjects,
    createNewProject,
    updateProject,
    deleteProject,
    getProject
}