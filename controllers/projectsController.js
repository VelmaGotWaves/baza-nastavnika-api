const Project = require('../model/Project');
const Professor = require('../model/Professor');
const path = require('path');
const fs = require('fs');

const deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            const curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

const parentDir = path.dirname(__dirname);

const dozvoljeneVrsteProjekata = ['medjunarodni', 'domaci', 'interni'];

function convertType(value) {
    if (value === "undefined") return undefined;
    if (value === "null") return null;
    if (value === "true") return true;
    if (value === "false") return false;
    var v = Number(value);
    return isNaN(v) ? value : v;
};

var ObjectId = require('mongoose').Types.ObjectId;

function fileExtensionLimiter(allowedExtArray) {
    const files = req.files

    const fileExtensions = []
    Object.keys(files).forEach(key => {
        if (Array.isArray(files[key])) {
            files[key].forEach(file => fileExtensions.push(path.extname(file.name)))
        } else {
            fileExtensions.push(path.extname(files[key].name))
        }

    })
    const allowed = fileExtensions.every(ext => allowedExtArray.includes(ext))

    if (!allowed) {
        const message = `Upload failed. Only ${allowedExtArray.toString()} files allowed.`.replaceAll(",", ", ");

        return res.status(422).json({ status: "error", message });
    }
}
function fileSizeLimiter() {
    const MB = 5;
    const FILE_SIZE_LIMIT = MB * 1024 * 1024;
    const filesOverLimit = [];
    const files = req.files;

    // Which files are over the limit?
    Object.keys(files).forEach(key => {
        if (Array.isArray(files[key])) {
            files[key].forEach(file => {
                if (file.size > FILE_SIZE_LIMIT) {
                    filesOverLimit.push(file);
                }
            });
        } else {
            if (files[key].size > FILE_SIZE_LIMIT) {
                filesOverLimit.push(files[key].name);
            }
        }
    });
    if (filesOverLimit.length) {

        const message = `Upload failed. ${filesOverLimit.toString()} su preko ogranicenja od ${MB} MB.`;

        return res.status(413).json({ status: "error", message });

    }
}

const getAllProjects = async (req, res) => {
    const projects = await Project.find();
    if (!projects) return res.status(204).json({ 'message': 'No project found.' });
    res.json(projects);
}

const createNewProject = async (req, res) => {
    if (!req?.body?.nazivProjekta) {
        return res.status(400).json({ 'message': 'Project name is required' });
    }
    if (!dozvoljeneVrsteProjekata.includes(req?.body?.vrstaProjekta)) {
        return res.status(400).json({ 'message': 'Vrsta projekta nije u formatu' });
    }
    // TODO MORAS DA PROMENIS SA PNG NA PRAVI TIP FAJLA ,, MORAS ERROR HANDLING OVDE DA ODRADIS BOZE, MORAS U gitignorujes uploads,, brda error handleovanja i ifova i ostale stvari sa objectId kad baci error znas sam
    let aneksi = undefined;
    if (Array.isArray(req?.files?.filesAneksi)) {
        aneksi = req?.files?.filesAneksi?.map(file => file.name);
    } else if (req?.files?.filesAneksi) {
        aneksi = req?.files?.filesAneksi?.name;
    }


    let datePlaniraniPocetak = undefined;
    try {
        const myDate = new Date(req?.body?.planiraniPocetak);
        if (isNaN(myDate.getTime())) {
            throw new Error('Invalid date planiraniPocetak');
        }
        datePlaniraniPocetak = myDate;
    } catch (error) {
        console.log('Invalid date planiraniPocetak');
    }
    let datePlaniraniZavrsetak = undefined;
    try {
        const myDate = new Date(req?.body?.planiraniZavrsetak);
        if (isNaN(myDate.getTime())) {
            throw new Error('Invalid date planiraniZavrsetak');
        }
        datePlaniraniZavrsetak = myDate;
    } catch (error) {
        console.log('Invalid date planiraniZavrsetak');
    }
    let konvertovanRukovodilac = convertType(req.body.rukovodilac);
    let chekiraniRukovodilac = (typeof konvertovanRukovodilac == "string" && (konvertovanRukovodilac == new ObjectId(konvertovanRukovodilac))) ? konvertovanRukovodilac : undefined;
    let konvertovanAdministrator = convertType(req.body.administrator);
    let chekiraniAdministrator = (typeof konvertovanAdministrator == "string" && (konvertovanAdministrator == new ObjectId(konvertovanAdministrator))) ? konvertovanAdministrator : undefined;

    let chekiraniClanoviProjektnogTima = JSON.parse(req.body?.clanoviProjektnogTima).map(clan => {
        let konvertovanClan = convertType(clan);
        if (typeof konvertovanClan == "string" && (konvertovanClan == new ObjectId(konvertovanClan))) {
            return konvertovanClan;
        } else { return undefined }
    })
    if (!req.files) {
        console.log("req.files je :")
        console.log(req?.files);

    } else {
        fileExtensionLimiter([".png", ".jpeg", ".txt", ".pdf", ".doc", ".docx", ".rtf"]);
        fileSizeLimiter();
        // nisi ni testirao ova dva koda...
    }

    let result = '';
    try {
        result = await Project.create({
            nazivProjekta: req.body.nazivProjekta,
            nazivPrograma: req.body.nazivPrograma,
            vrstaProjekta: req.body.vrstaProjekta,
            programFinansiranja: req.body.programFinansiranja,
            referentniBroj: req.body.referentniBroj,
            interniBroj: req.body.interniBroj,
            rukovodilac: chekiraniRukovodilac,
            administrator: chekiraniAdministrator,
            profitniCentar: req.body.profitniCentar,
            planiraniPocetak: datePlaniraniPocetak,
            planiraniZavrsetak: datePlaniraniZavrsetak,
            trajanje: req.body.trajanje,
            ukupanBudzet: req.body.ukupanBudzet,
            budzetZaFon: req.body.budzetZaFon,
            opis: req.body.opis,
            ciljevi: req.body.ciljevi,
            partnerskeInstitucije: JSON.parse(req.body.partnerskeInstitucije),
            clanoviProjektnogTima: chekiraniClanoviProjektnogTima,
            website: req.body.website,
            kljucneReci: JSON.parse(req.body.kljucneReci),
            ugovor: req?.files?.fileUgovor?.name,
            aneksi: aneksi,

        });

    } catch (err) {
        console.error(err);
        return;
    }



    if (!req?.files) {
        return res.json({ msg: 'No file uploaded', result });
    }
    if (req?.files?.fileUgovor) {
        const fileUgovor = req.files.fileUgovor;

        fileUgovor.mv(`${parentDir}/uploads/projects/${result._id}/ugovor/${fileUgovor.name}`, err => {
            if (err) {
                console.error(err);
                return res.status(500).send(err);
            }
            console.log(`uspesno sacuvan ${fileUgovor.name}`)
        });
    }

    if (Array.isArray(req?.files?.filesAneksi)) {
        req.files.filesAneksi.forEach(aneks => {
            aneks.mv(`${parentDir}/uploads/projects/${result._id}/aneksi/${aneks.name}`, err => {
                if (err) {
                    console.error(err);
                    return res.status(500).send(err);
                }
                console.log(`uspesno sacuvan ${aneks.name}`)
            });
        });
    } else if (req?.files?.filesAneksi) {
        const fileAneks = req.files.filesAneksi;

        fileAneks.mv(`${parentDir}/uploads/projects/${result._id}/ugovor/${fileAneks.name}`, err => {
            if (err) {
                console.error(err);
                return res.status(500).send(err);
            }
            console.log(`uspesno sacuvan ${fileAneks.name}`)
        });
    }


    res.json(result);
}

const updateProject = async (req, res) => {
    // OVO NIJE GOTOVO _______________________________________________________________________________________________________________________________________________________
    if (!req?.body?.id) {
        return res.status(400).json({ 'message': 'ID parameter is required.' });
    } req.body.id == new ObjectId(req.body.id)
    if (req.body.id != new ObjectId(req.body.id)) {
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
    // ovde ces da zapamtis obrisane profesore i obrises projekte iz njihovog polja, nakon toga ces da ubacujes iz result._id i result.administrator, rukovodilac, clanovi... itd
}

const deleteProject = async (req, res) => {
    if (!req?.body?.id) return res.status(400).json({ 'message': 'Project ID required.' });
    if (req.body.id != new ObjectId(req.body.id)) {
        return res.status(404).json({ "message": `No project matches ID ${req.body.id}.` });
    }
    const project = await Project.findOne({ _id: req.body.id }).exec();
    if (!project) {
        return res.status(404).json({ "message": `No project matches ID ${req.body.id}.` });
    }


    const result = await project.deleteOne(); //{ _id: req.body.id }

    deleteFolderRecursive(`${parentDir}/uploads/projects/${result._id}`);

    try {
        const remove = await Professor.updateMany({ projekti: { $elemMatch: { $eq: result._id } } }, { $pull: { projekti: { $eq: result._id } } });
    } catch (error) {
        console.log(error)
    }
    res.json(result);
}

const getProject = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ 'message': 'Project ID required.' });
    if (req.body.id != new ObjectId(req.body.id)) {
        return res.status(404).json({ "message": `No project matches ID ${req.body.id}.` });
    }
    const project = await Project.findOne({ _id: req.params.id }).exec().catch(console.error);
    if (!project) {
        return res.status(404).json({ "message": `No project matches ID ${req.params.id}.` });
    }
    res.json(project);
}
// dodaj jos 3 rute, jednu za menjanje ugovora, jednu za dodavanje aneksa, jednu za overwritovanje aneksa
// dodaj jos 2 rute, jednu za getovanje ugovora, jednu za getovanje aneksa, jednu za getovanje svih fajlova, to ces u drugom fajlu
module.exports = {
    getAllProjects,
    createNewProject,
    updateProject,
    deleteProject,
    getProject
}