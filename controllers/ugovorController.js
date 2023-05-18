const Project = require('../model/Project');
const path = require('path');
const fs = require('fs');

const parentDir = path.dirname(__dirname);

var ObjectId = require('mongoose').Types.ObjectId;
// ove dve funkcije napravi u middlware koji ces da importujes iz middleware foldera, ali kasnije TODO
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
  const files =req.files;

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

const getUgovor = async (req, res) => {
  // ovaj kod slepo kucan, kao ostatak u ovom fajlu
  // moras da testiras sta ako se obrise pa se ponovo doda, pa se update, pa se obrise, pa se update TODO
  if (!req?.params?.id) return res.status(400).json({ 'message': 'Projekat ID je neophodan.' });
  if (req?.params?.id != new ObjectId(req?.params?.id)) return res.status(400).json({ 'message': 'Projekat ID nije u dobrom formatu.' });

  const options = {
    root: path.join(parentDir, "uploads", "projects", req?.params?.id, "ugovor")
  };

  const project = Project.findOne({ _id: req.params.id });
  if (project.ugovor) {
    res.sendFile(project.ugovor, options, function (err) {
      if (err) {
        return res.sendStatus(404).json({ "message": "Greska pri nalazenju fajla ugovora" });
      } else {
        console.log('Sent:', fileName);
      }
    });
  } else {
    return res.sendStatus(404).json({ "message": "Nedostaje fajl ugovora" });
  }

}

const updateUgovor = async (req, res) => {
  if (!req?.params?.id) return res.status(400).json({ 'message': 'Projekat ID je neophodan.' });
  if (req?.params?.id != new ObjectId(req?.params?.id)) return res.status(400).json({ 'message': 'Projekat ID nije u dobrom formatu.' });
  if (!req?.files?.fileUgovor) {
    console.log("req.files je :")
    console.log(req?.files);
    return res.sendStatus(400).json({ 'message': 'Server nije primio fajl' })
    // mozes u ovom slucaju umesto return da samo obrises vec postojeci, ali za to vec postiji delete tkd mozda ne.

  } else {
    fileExtensionLimiter([".png", ".jpeg", ".txt", ".pdf", ".doc", ".docx", ".rtf", ".xls"]);
    fileSizeLimiter();
    // nisi ni testirao ova dva koda...
  }

  const project = Project.findOne({ _id: req.params.id });
  if (project.ugovor) {
    fs.unlink(`${parentDir}/uploads/projects/${req.params.id}/ugovor/${project.ugovor}`, (err) => {
      if (err) {
        console.error(err);
        return res.sendStatus(400).json({ 'message': `Greska pri brisanju ${req.params.id}/ugovor/${project.ugovor}` })
      }
      console.log(`File ${req.params.id}/ugovor/${projekta.ugovor} has been deleted`);
      project.ugovor = undefined;
    })
  }


  const fileUgovor = req.files.fileUgovor;

  fileUgovor.mv(`${parentDir}/uploads/projects/${req.params.id}/ugovor/${fileUgovor.name}`, async (err) => {
    if (err) {
      await project.save();
      console.error(err);
      return res.status(500).send(err);
    }
    console.log(`uspesno sacuvan ${fileUgovor.name}`)

    project.ugovor = fileUgovor.name;

  });
  const result = await project.save();
  res.json({ result });
}

const deleteUgovor = async (req, res) => {
  if (!req?.params?.id) return res.status(400).json({ 'message': 'Projekat ID je neophodan.' });
  if (req?.params?.id != new ObjectId(req?.params?.id)) return res.status(400).json({ 'message': 'Projekat ID nije u dobrom formatu.' });

  const project = Project.findOne({ _id: req.params.id });
  if (project.ugovor) {
    fs.unlink(`${parentDir}/uploads/projects/${req.params.id}/ugovor/${project.ugovor}`, async (err) => {
      if (err) {
        console.error(err);
        return res.sendStatus(400).json({ 'message': `Greska pri brisanju ${req.params.id}/ugovor/${project.ugovor}` })
      }
      console.log(`File ${req.params.id}/ugovor/${projekta.ugovor} has been deleted`);
      project.ugovor = undefined;
      const result = await project.save();
      return res.json({ result });
    })
  } else {
    return res.sendStatus(404).json({ "message": "Projekat nema ugovor za brisanje" })
  }

}

module.exports = {
  getUgovor,
  updateUgovor,
  deleteUgovor
}