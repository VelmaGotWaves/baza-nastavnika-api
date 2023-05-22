const Project = require('../model/Project');
const Professor = require('../model/Professor');
const path = require('path');
const fs = require('fs');

function hasDuplicateValues(array) {
    if (Array.isArray(array)) {
        for (let i = 0; i < array.length; i++) {
            for (let j = i + 1; j < array.length; j++) {
                if (array[i] === array[j]) {
                    return true;
                }
            }
        }
        return false;
    } else return false;

}

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

function fileExtensionLimiter(allowedExtArray, req, res) {
    const files = req.files

    const fileExtensions = []
    Object.keys(files).forEach(key => {
        if (Array.isArray(files[key])) {
            files[key].forEach(file => fileExtensions.push(path.extname(file.name).toLowerCase()))
        } else {
            fileExtensions.push(path.extname(files[key].name).toLowerCase())
        }

    })
    const allowed = fileExtensions.every(ext => allowedExtArray.includes(ext))

    if (!allowed) {
        const message = `Upload failed. Only ${allowedExtArray.toString()} files allowed.`.replaceAll(",", ", ");
        res.status(422).json({ status: "error", message });
        return false;
    }
    return true;
}
function fileSizeLimiter(req, res) {
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
        res.status(413).json({ status: "error", message });
        return false;

    }
    return true;
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
    let aneksi = undefined;
    if (Array.isArray(req?.files?.filesAneksi)) {
        aneksi = req?.files?.filesAneksi?.map(file => file.name);
    } else if (req?.files?.filesAneksi) {
        aneksi = req?.files?.filesAneksi?.name;
    }
    if (hasDuplicateValues(aneksi)) {
        return res.status(400).json({ 'message': 'Dva fajla aneksa nose isto ime' });
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
        if (!fileExtensionLimiter([".png", ".jpeg", ".txt", ".pdf", ".doc", ".docx", ".rtf", ".xls"], req, res)) return;
        if (!fileSizeLimiter(req, res)) return;
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

    await Professor.updateMany(
        { _id: { $in: chekiraniClanoviProjektnogTima } },
        { $push: { projekti: { projekatId: result._id, uloga: "Clan projektnog tima" } } }
    );
    await Professor.updateOne(
        { _id: chekiraniRukovodilac },
        { $push: { projekti: { projekatId: result._id, uloga: "Rukovodilac" } } }
    );
    await Professor.updateOne(
        { _id: chekiraniAdministrator },
        { $push: { projekti: { projekatId: result._id, uloga: "Administrator" } } }
    );

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
    //ovde neces da updejtujes fajlove, zato si razdvojio fajlove od ovoga
    if (!req?.params?.id) return res.status(400).json({ 'message': 'Project ID required.' });
    if (req.body.id != new ObjectId(req.body.id)) {
        return res.status(404).json({ "message": `No project matches ID ${req.body.id}.` });
    }
    const project = await Project.findOne({ _id: req.params.id }).exec().catch(console.error);
    if (!project) {
        return res.status(404).json({ "message": `No project matches ID ${req.params.id}.` });
    }
    if (!req?.body?.nazivProjekta) {
        return res.status(400).json({ 'message': 'Project name is required' });
    }
    if (!dozvoljeneVrsteProjekata.includes(req?.body?.vrstaProjekta)) {
        return res.status(400).json({ 'message': 'Vrsta projekta nije u formatu' });
    }


    let datePlaniraniPocetak = undefined;
    try {
        const myDate = new Date(req.body?.planiraniPocetak);
        if (isNaN(myDate.getTime())) {
            throw new Error('Invalid date planiraniPocetak');
        }
        datePlaniraniPocetak = myDate;
    } catch (error) {
        console.log('Invalid date planiraniPocetak');
    }
    let datePlaniraniZavrsetak = undefined;
    try {
        const myDate = new Date(req.body?.planiraniZavrsetak);
        if (isNaN(myDate.getTime())) {
            throw new Error('Invalid date planiraniZavrsetak');
        }
        datePlaniraniZavrsetak = myDate;
    } catch (error) {
        console.log('Invalid date planiraniZavrsetak');
    }
    let chekiraniRukovodilac = req.body.rukovodilac == new ObjectId(req.body.rukovodilac) ? req.body.rukovodilac : undefined;
    let chekiraniAdministrator = req.body.administrator == new ObjectId(req.body.administrator) ? req.body.administrator : undefined;

    let chekiraniClanoviProjektnogTima = req.body?.clanoviProjektnogTima.map(clan => {
        if (typeof clan == "string" && (clan == new ObjectId(clan))) {
            return clan;
        } else { return undefined }
    })

    const stariRukovodilac = project.rukovodilac;
    const stariAdministrator = project.administrator;
    const stariClanoviProjektnog = project.clanoviProjektnogTima;

    if (req.body?.nazivProjekta) project.nazivProjekta = req.body.nazivProjekta;
    if (req.body?.nazivPrograma) project.nazivPrograma = req.body.nazivPrograma;
    if (req.body?.vrstaProjekta) project.vrstaProjekta = req.body.vrstaProjekta;
    if (req.body?.programFinansiranja) project.programFinansiranja = req.body.programFinansiranja;
    if (req.body?.referentniBroj) project.referentniBroj = req.body.referentniBroj;
    if (req.body?.interniBroj) project.interniBroj = req.body.interniBroj;
    if (req.body?.rukovodilac) project.rukovodilac = chekiraniRukovodilac;
    if (req.body?.administrator) project.administrator = chekiraniAdministrator;
    if (req.body?.profitniCentar) project.profitniCentar = req.body.profitniCentar;
    if (req.body?.planiraniPocetak) project.planiraniPocetak = datePlaniraniPocetak;
    if (req.body?.planiraniZavrsetak) project.planiraniZavrsetak = datePlaniraniZavrsetak;
    if (req.body?.trajanje) project.trajanje = req.body.trajanje;
    if (req.body?.ukupanBudzet) project.ukupanBudzet = req.body.ukupanBudzet;
    if (req.body?.budzetZaFon) project.budzetZaFon = req.body.budzetZaFon;
    if (req.body?.opis) project.opis = req.body.opis;
    if (req.body?.ciljevi) project.ciljevi = req.body.ciljevi;
    if (req.body?.partnerskeInstitucije) project.partnerskeInstitucije = req.body.partnerskeInstitucije;
    if (req.body?.clanoviProjektnogTima) project.clanoviProjektnogTima = chekiraniClanoviProjektnogTima;
    if (req.body?.website) project.website = req.body.website;
    if (req.body?.kljucneReci) project.kljucneReci = req.body.kljucneReci;

    const result = await project.save();

    if (stariAdministrator != result.administrator) {
        await Professor.updateOne(
            { _id: stariAdministrator },
            { $pull: { projekti: { $elemMatch: { projekatId: result._id } } } }
        )
        // elemMatch nije potrebam moze i ovako
        // Professor.updateOne(
        //     { _id: req.body.rukovodilac },
        //     { $pull: { projekti: { projekatId: result._id } } }
        //   );
        await Professor.updateOne(
            { _id: result.administrator },
            { $push: { projekti: { projekatId: result._id, uloga: "Administrator" } } }
        )
    }
    if (stariRukovodilac != result.rukovodilac) {
        await Professor.updateOne(
            { _id: stariRukovodilac },
            { $pull: { projekti: { $elemMatch: { projekatId: result._id } } } }
        )
        // elemMatch nije potrebam moze i ovako
        // Professor.updateOne(
        //     { _id: req.body.rukovodilac },
        //     { $pull: { projekti: { projekatId: result._id } } }
        //   );
        await Professor.updateOne(
            { _id: result.rukovodilac },
            { $push: { projekti: { projekatId: result._id, uloga: "Rukovodilac" } } }
        )
    }
    if (stariClanoviProjektnog != result.clanoviProjektnogTima) {
        await Professor.updateMany(
            { _id: { $in: stariClanoviProjektnog } },
            { $pull: { projekti: { $elemMatch: { projekatId: result._id } } } }
        )
        await Professor.updateMany(
            { _id: { $in: result.clanoviProjektnogTima } },
            { $push: { projekti: { projekatId: result._id, uloga: "Clan projektnog tima" } } }
        )
    }

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

        const remove = await Professor.updateMany(
            { "projekti.projekatId": result._id },
            { $pull: { projekti: { projekatId: result._id } } }
        );
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
module.exports = {
    getAllProjects,
    createNewProject,
    updateProject,
    deleteProject,
    getProject
}