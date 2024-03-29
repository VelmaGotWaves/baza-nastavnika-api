const Project = require('../model/Project');
const path = require('path');
const fs = require('fs');

const parentDir = path.dirname(__dirname);

var ObjectId = require('mongoose').Types.ObjectId;
// ove dve funkcije napravi u middlware koji ces da importujes iz middleware foldera, ali kasnije TODO
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
    res.status(415).json({ status: "error", message });
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

const getUgovor = async (req, res) => {
  // ovaj kod slepo kucan, kao ostatak u ovom fajlu
  // moras da testiras sta ako se obrise pa se ponovo doda, pa se update, pa se obrise, pa se update TODO
  if (!req?.params?.id) return res.status(400).json({ 'message': 'Projekat ID je neophodan.' });
  if (req?.params?.id != new ObjectId(req?.params?.id)) return res.status(400).json({ 'message': 'Projekat ID nije u dobrom formatu.' });

  const options = {
    root: path.join(parentDir, "uploads", "projects", req?.params?.id, "ugovor")
  };

  const project = await Project.findOne({ _id: req.params.id });
  if (!project) {
    return res.status(404).json({ "message": `No project matches ID ${req.params.id}.` });
  }
  if (project.ugovor) {
    res.setHeader("Content-Disposition", `attachment: filename=${project.ugovor}`)
    res.sendFile(project.ugovor, options, function (err) {
      if (err) {
        return res.status(500).json({ "message": "Greska pri nalazenju fajla ugovora" });
      } else {
        console.log('Sent:', project.ugovor);
      }
    });
  } else {
    return res.status(410).json({ "message": "Nedostaje fajl ugovora" });
  }

}

const updateUgovor = async (req, res) => {
  if (!req?.params?.id) return res.status(400).json({ 'message': 'Projekat ID je neophodan.' });
  if (req?.params?.id != new ObjectId(req?.params?.id)) return res.status(400).json({ 'message': 'Projekat ID nije u dobrom formatu.' });
  if (!req?.files?.fileUgovor) {
    console.log("req.files je :")
    console.log(req?.files);
    return res.status(417).json({ 'message': 'Server nije primio fajl' })

  } else {
    if (!fileExtensionLimiter([".png", ".jpeg", ".txt", ".pdf", ".doc", ".docx", ".rtf", ".xls"], req, res)) return;
    if (!fileSizeLimiter(req, res)) return;
  }
  const project = await Project.findOne({ _id: req.params.id });
  console.log(project)
  if (project.ugovor) {
    fs.unlink(`${parentDir}/uploads/projects/${req.params.id}/ugovor/${project.ugovor}`, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ 'message': `Greska pri brisanju ${req.params.id}/ugovor/${project.ugovor}` })
      }
      console.log(`File ${req.params.id}/ugovor/${project.ugovor} has been deleted`);
      project.ugovor = undefined;
      console.log("project.ugovor posle delete je :" + project.ugovor)
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
    console.log("project.ugovor posle dodavanje je : " + project.ugovor)
    const result = await project.save();
    console.log(result)
    res.json(result);

  });

  // error je da jednostavno nece da se updejtuje , ovaj project.save() ne radi nista ocigledo iako je result tacno ono sto sam hteo on ga jebeno ne sejva
}

const deleteUgovor = async (req, res) => {
  if (!req?.params?.id) return res.status(400).json({ 'message': 'Projekat ID je neophodan.' });
  if (req?.params?.id != new ObjectId(req?.params?.id)) return res.status(400).json({ 'message': 'Projekat ID nije u dobrom formatu.' });

  const project = await Project.findOne({ _id: req.params.id });
  if (!project) {
    return res.status(404).json({ "message": `No project matches ID ${req.params.id}.` });
  }
  if (project.ugovor) {
    fs.unlink(`${parentDir}/uploads/projects/${req.params.id}/ugovor/${project.ugovor}`, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ 'message': `Greska pri brisanju ${req.params.id}/ugovor/${project.ugovor}` })
      }
      console.log(`File ${req.params.id}/ugovor/${project.ugovor} has been deleted`);
      project.ugovor = undefined;
      const result = await project.save();
      return res.json( result );
    })
  } else {
    return res.status(410).json({ "message": "Projekat nema ugovor za brisanje" })
  }

}

module.exports = {
  getUgovor,
  updateUgovor,
  deleteUgovor
}