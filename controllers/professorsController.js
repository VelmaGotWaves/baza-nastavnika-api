const Professor = require('../model/Professor');
const KATEDRE = require('../data/katedre');
const OBLASTI_ISTRAZIVANJA = require('../data/oblastiIstrazivanja');
var ObjectId = require('mongoose').Types.ObjectId;

const getAllProfessors = async (req, res) => {
    const professors = await Professor.find();
    if (!professors) return res.status(204).json({ 'message': 'No professor found.' });
    res.json(professors);
}

const createNewProfessor = async (req, res) => {
    if (!req?.body?.ime || !req?.body?.prezime ) {
        return res.status(400).json({ 'message': 'First and last names are required' });
    }
    if(req?.body?.katedre.length != 0 && !req?.body?.katedre.every(val => KATEDRE.katedre.includes(val))){
        return res.status(400).json({'message': 'Greska pri unosu katedra'})
    }
    if(req?.body?.oblastiIstrazivanja.length != 0 && !req?.body?.oblastiIstrazivanja.every(val => OBLASTI_ISTRAZIVANJA.oblastiIstrazivanja.includes(val))){
        return res.status(400).json({'message': 'Greska pri unosu oblasti istrazivanja'})
    }
    // mozda ovde error handling , ako projekti nisu objectid
    try {
        const result = await Professor.create({
            ime: req.body.ime,
            prezime: req.body.prezime,
            titula: req.body.titula,
            oblastiIstrazivanja: req.body.oblastiIstrazivanja,
            katedre: req.body.katedre,
            publikacije:req.body.publikacije,
            projekti: req.body.projekti,
            tagovi: req.body.tagovi
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
        return res.status(404).json({ "message": `No professor matches ID ${req.body.id}.` });
    }
    if(req?.body?.katedre.length != 0 && !req?.body?.katedre.every(val => KATEDRE.katedre.includes(val))){
        return res.status(400).json({'message': 'Greska pri unosu katedra'})
    }
    if(req?.body?.oblastiIstrazivanja.length != 0 && !req?.body?.oblastiIstrazivanja.every(val => OBLASTI_ISTRAZIVANJA.oblastiIstrazivanja.includes(val))){
        return res.status(400).json({'message': 'Greska pri unosu oblasti istrazivanja'})
    }
    if (req.body?.ime) professor.ime = req.body.ime;
    if (req.body?.prezime) professor.prezime = req.body.prezime;
    if (req.body?.titula) professor.titula = req.body.titula;
    if (req.body?.oblastiIstrazivanja) professor.oblastiIstrazivanja = req.body.oblastiIstrazivanja;
    if (req.body?.katedre) professor.katedre = req.body.katedre;
    if (req.body?.publikacije) professor.publikacije = req.body.publikacije;
    if (req.body?.projekti) professor.projekti = req.body.projekti;
    if (req.body?.tagovi) professor.tagovi = req.body.tagovi;

    const result = await professor.save();
    res.json(result);
}
// TODO promeni svuda if objectId, takodje promeni svuda menjanje projekta i promeni svuda vezu sa projektima i promeni u model baze
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
    console.log(result)
    // ovde ces da dodas obrisi u svakom projektu gde se nalazi result._id
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