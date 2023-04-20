const Professor = require('../model/Professor');

const getAllProfessors = async (req, res) => {
    const professors = await Professor.find();
    if (!professors) return res.status(204).json({ 'message': 'No professor found.' });
    res.json(professors);
}

const createNewProfessor = async (req, res) => {
    if (!req?.body?.firstname || !req?.body?.lastname ) {
        return res.status(400).json({ 'message': 'First and last names are required' });
    }

    try {
        const result = await Professor.create({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            title: req.body.title,
            scientificResearch: req.body.scientificResearch,
            labaratories: req.body.labaratories,
            scientificProjects:req.body.scientificProjects,
            significantPublications: req.body.significantPublications,
            tags: req.body.tags
        });

        res.status(201).json(result);
    } catch (err) {
        console.error(err);
    }
}

const updateProfessor = async (req, res) => {
    if (!req?.body?.id) {
        return res.status(400).json({ 'message': 'ID parameter is required.' });
    }
    if(req.body.id.length != 24){
        return res.status(404).json({ "message": `No professor matches ID ${req.body.id}.` });
    }
    const professor = await Professor.findOne({ _id: req.body.id }).exec();
    if (!professor) {
        return res.status(204).json({ "message": `No professor matches ID ${req.body.id}.` });
    }
    if (req.body?.firstname) professor.firstname = req.body.firstname;
    if (req.body?.lastname) professor.lastname = req.body.lastname;
    if (req.body?.title) professor.title = req.body.title;
    if (req.body?.scientificResearch) professor.scientificResearch = req.body.scientificResearch;
    if (req.body?.labaratories) professor.labaratories = req.body.labaratories;
    if (req.body?.significantPublications) professor.significantPublications = req.body.significantPublications;
    if (req.body?.scientificProjects) professor.scientificProjects = req.body.scientificProjects;
    if (req.body?.tags) professor.tags = req.body.tags;

    const result = await professor.save();
    res.json(result);
}

const deleteProfessor = async (req, res) => {
    if (!req?.body?.id) return res.status(400).json({ 'message': 'Professor ID required.' });
    if(req.body.id.length != 24){
        // console.log('nije24')
        return res.status(404).json({ "message": `No professor matches ID ${req.body.id}.` });
    }
    const professor = await Professor.findOne({ _id: req.body.id }).exec();
    if (!professor) {
        return res.status(204).json({ "message": `No professor matches ID ${req.body.id}.` });
    }
    const result = await professor.deleteOne(); //{ _id: req.body.id }
    res.json(result);
}

const getProfessor = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ 'message': 'Professor ID required.' });
    if(req.body.id.length != 24){
        return res.status(404).json({ "message": `No professor matches ID ${req.body.id}.` });
    }
    const professor = await Professor.findOne({ _id: req.params.id }).exec().catch(console.error);
    if (!professor) {
        return res.status(204).json({ "message": `No professor matches ID ${req.params.id}.` });
    }
    res.json(professor);
}

module.exports = {
    getAllProfessors,
    createNewProfessor,
    updateProfessor,
    deleteProfessor,
    getProfessor
}