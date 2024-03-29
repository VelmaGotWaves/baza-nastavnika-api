const Professor = require('../model/Professor');
const KATEDRE = require('../data/katedre');
const OBLASTI_ISTRAZIVANJA = require('../data/oblastiIstrazivanja');
const ZVANJA = require("../data/zvanja");
const Project = require("../model/Project");
var ObjectId = require('mongoose').Types.ObjectId;

const getAllProfessors = async (req, res) => {
    const professors = await Professor.find();
    if (!professors) return res.status(204).json({ 'message': 'No professor found.' });
    res.json(professors);
}

const createNewProfessor = async (req, res) => {
    if (!req?.body?.ime || !req?.body?.prezime) {
        return res.status(400).json({ 'message': 'First and last names are required' });
    }
    if (req.body?.katedre.length != 0 && !req?.body?.katedre.every(val => KATEDRE.katedre.includes(val))) {
        return res.status(400).json({ 'message': 'Greska pri unosu katedra' })
    }
    if (req.body?.oblastiIstrazivanja.length != 0 && !req?.body?.oblastiIstrazivanja.every(val => OBLASTI_ISTRAZIVANJA.oblastiIstrazivanja.includes(val))) {
        return res.status(400).json({ 'message': 'Greska pri unosu oblasti istrazivanja' })
    }
    if (req.body?.zvanje && !ZVANJA.includes(req.body.zvanje)) {
        return res.status(400).json({ 'message': 'Greska pri unosu zvanja' })
    }
    // sigurno ima bolje resenje ali...
    if (!req.body?.pol && !["muski", "zenski"].includes(req.body.pol)) {
        return res.status(400).json({ 'message': 'Greska pri unosu pola' })
    }
    //projekti: req.body.projekti, => ovo je trenutno obrisano, vrati ga kad budes hteo da dodajes projekte sa strane createNewProf

    try {
        const result = await Professor.create({
            ime: req.body.ime,
            prezime: req.body.prezime,
            titula: req.body.titula,
            oblastiIstrazivanja: req.body.oblastiIstrazivanja,
            katedre: req.body.katedre,
            publikacije: req.body.publikacije,
            tagovi: req.body.tagovi,
            pol:req.body.pol,
            email:req.body.email,
            zvanje:req.body.zvanje
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
    if (req.body.id != new ObjectId(req.body.id)) {
        return res.status(404).json({ "message": `No professor matches ID ${req.body.id}.` });
    }
    const professor = await Professor.findOne({ _id: req.body.id }).exec();
    if (!professor) {
        return res.status(404).json({ "message": `No professor matches ID ${req.body.id}.` });
    }
    if (req.body?.katedre.length != 0 && !req.body?.katedre.every(val => KATEDRE.katedre.includes(val))) {
        return res.status(400).json({ 'message': 'Greska pri unosu katedra' })
    }
    if (req?.body?.oblastiIstrazivanja.length != 0 && !req?.body?.oblastiIstrazivanja.every(val => OBLASTI_ISTRAZIVANJA.oblastiIstrazivanja.includes(val))) {
        return res.status(400).json({ 'message': 'Greska pri unosu oblasti istrazivanja' })
    }
    if (req.body?.zvanje && !ZVANJA.includes(req.body.zvanje)) {
        return res.status(400).json({ 'message': 'Greska pri unosu zvanja' })
    }
    // sigurno ima bolje resenje ali...
    if (req.body?.pol && !["Muški", "Ženski"].includes(req.body.pol)) {
        return res.status(400).json({ 'message': 'Greska pri unosu pola' })
    }
    if (req.body?.ime) professor.ime = req.body.ime;
    if (req.body?.prezime) professor.prezime = req.body.prezime;
    if (req.body?.titula) professor.titula = req.body.titula;
    if (req.body?.pol) professor.pol = req.body.pol;

    professor.oblastiIstrazivanja = req.body.oblastiIstrazivanja;
    professor.email = req.body.email;
    professor.zvanje = req.body.zvanje;
    professor.katedre = req.body.katedre;
    professor.publikacije = req.body.publikacije;
    // if (req.body?.projekti) professor.projekti = req.body.projekti; ovo je trenutno obrisano, vrati ga kad budes hteo da dodajes projekte sa strane createNewProf
    professor.tagovi = req.body.tagovi;

    const result = await professor.save();
    res.json(result);
}
const deleteProfessor = async (req, res) => {
    if (!req?.body?.id) return res.status(400).json({ 'message': 'Professor ID required.' });
    if (req.body.id != new ObjectId(req.body.id)) {
        return res.status(404).json({ "message": `No professor matches ID ${req.body.id}.` });
    }
    const professor = await Professor.findOne({ _id: req.body.id }).exec();
    if (!professor) {
        return res.status(204).json({ "message": `No professor matches ID ${req.body.id}.` });
    }
    const result = await professor.deleteOne(); //{ _id: req.body.id }
    console.log(result)

    await Project.updateMany(
        { administrator: result._id },
        { $set: { administrator: undefined } }
    )

    await Project.updateMany(
        { rukovodilac: result._id },
        { $set: { rukovodilac: undefined } }
    )
    await Project.updateMany(
        { clanoviProjektnogTima: {$elemMatch: {$eq: result._id}}},
        { $pull: {clanoviProjektnogTima: {$elemMatch: {$eq: result._id}}}}
    )
    res.json(result);
}

const getProfessor = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ 'message': 'Professor ID required.' });
    if (req.params.id != new ObjectId(req.params.id)) {
        return res.status(404).json({ "message": `No professor matches ID ${req.body.id}.` });
    }
    const professor = await Professor.findOne({ _id: req.params.id }).exec().catch(console.error);
    if (!professor) {
        return res.status(404).json({ "message": `No professor matches ID ${req.params.id}.` });
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