const Project = require('../model/Project');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const parentDir = path.dirname(__dirname);

var ObjectId = require('mongoose').Types.ObjectId;

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
// ove dve funkcije napravi u middlware koji ces da importujes iz middleware foldera, ali kasnije
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


const getAllAneksi = async (req, res) => {
  if (!req?.params?.id) return res.status(400).json({ 'message': 'Project ID required.' });
  if (req?.params?.id != new ObjectId(req?.params?.id)) return res.status(400).json({ 'message': 'Projekat ID nije u dobrom formatu.' });

  const project = await Project.findOne({ _id: req.params.id }).exec();
  if (!project) {
    return res.status(404).json({ "message": `No project matches ID ${req.params.id}.` });
  }
  if (project.aneksi?.length) {

    const files = project.aneksi.map(imeAneksa => {
      return `${parentDir}/uploads/projects/${project._id}/aneksi/${imeAneksa}`
    })
    const zipName = 'aneksi.zip';
    const output = fs.createWriteStream(zipName);
    const archive = archiver('zip');
    try {
      output.on('close', () => {
        res.download(zipName);
      });

      archive.pipe(output);

      files.forEach((file) => {
        archive.file(file, { name: file.split('/').pop() });

      });

      await archive.finalize();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }



  } else {
    res.status(410).json({ 'message': `Projekat ${project._id} nema anekse ` })
  }
}

const createNewAneks = async (req, res) => {

  if (!req?.params?.id) return res.status(400).json({ 'message': 'Project ID required.' });
  if (req?.params?.id != new ObjectId(req?.params?.id)) return res.status(400).json({ 'message': 'Projekat ID nije u dobrom formatu.' });
  const project = await Project.findOne({ _id: req.params.id });
  if (!project) {
    return res.status(404).json({ "message": `No project matches ID ${req.params.id}.` });
  }

  let aneksiImena = undefined;
  let aneksiFajlovi = [];
  if (Array.isArray(req?.files?.filesAneksi)) {
    aneksiImena = req.files.filesAneksi.map(file => file.name);
    aneksiFajlovi = req.files.filesAneksi;
  } else if (req?.files?.filesAneksi) {
    aneksiImena = [req.files.filesAneksi.name];
    aneksiFajlovi = [req.files.filesAneksi];
  } else {
    console.log("req.files je :")
    console.log(req?.files);
    return res.status(417).json({ 'message': 'Server nije primio fajl' })
  }
  if (aneksiImena.some(fajl => project.aneksi?.includes(fajl)) || hasDuplicateValues(aneksiImena)) {
    return res.status(409).json({ 'message': 'Vec postoji fajl sa tim imenom' })
  }
  if (!fileExtensionLimiter([".png", ".jpeg", ".txt", ".pdf", ".doc", ".docx", ".rtf", ".xls"], req, res)) return;
  if (!fileSizeLimiter(req, res)) return;



  aneksiFajlovi.forEach(async (aneks) => {
    await aneks.mv(`${parentDir}/uploads/projects/${req.params.id}/aneksi/${aneks.name}`, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }
      console.log(`uspesno sacuvan ${aneks.name}`)

    });
  });
  project.aneksi = [...(project.aneksi ?? []), ...aneksiImena];
  const result = await project.save();
  res.json( result );

}

const deleteAllAneksi = async (req, res) => {
  if (!req?.params?.id) return res.status(400).json({ 'message': 'Project ID required.' });
  if (req.params.id != new ObjectId(req.params.id)) return res.status(400).json({ 'message': 'Projekat ID nije u dobrom formatu.' });

  const project = await Project.findOne({ _id: req.params.id }).exec();
  if (!project) {
    return res.status(404).json({ "message": `No project matches ID ${req.params.id}.` });
  }
  if (project?.aneksi?.length) {
    deleteFolderRecursive(`${parentDir}/uploads/projects/${project._id}/aneksi`);
    project.aneksi = [];
    const result = await project.save();
    res.json({ 'message': 'Uspesno ste obrisali' })
  } else {
    return res.status(410).json({ 'message': `Projekat ${project._id} nema anekse ` })
  }


}

const getAneks = async (req, res) => {
  if (!req?.params?.id) return res.status(400).json({ 'message': 'Project ID required.' });
  if (req.params.id != new ObjectId(req.params.id)) return res.status(400).json({ 'message': 'Projekat ID nije u dobrom formatu.' });
  if (!req.params?.name) return res.status(400).json({ 'message': 'Name of the file is required.' });

  const project = await Project.findOne({ _id: req.params.id });
  if (!project) {
    return res.status(404).json({ "message": `No project matches ID ${req.params.id}.` });
  }
  if (!project.aneksi.some(aneks => aneks.name == req.params.name)) {
    return res.status(404).json({ "message": `No aneks matches name ${req.params.name}.` });
  }
  const options = {
    root: path.join(parentDir, "uploads", "projects", req.params.id, "aneksi")
  };

  res.sendFile(req.params.name, options, function (err) {
    if (err) {
      return res.status(500).json({ "message": "Greska pri nalazenju fajla aneksa" });
    } else {
      console.log('Sent:', req.params.name);
    }
  });


}

const deleteAneks = async (req, res) => {
  // mozes umesto params u body da promenis ako te ne mrzi, hvala TODO
  if (!req?.params?.id) return res.status(400).json({ 'message': 'Project ID required.' });
  if (req.params.id != new ObjectId(req.params.id)) return res.status(400).json({ 'message': 'Projekat ID nije u dobrom formatu.' });
  if (!req.params?.name) return res.status(400).json({ 'message': 'Name of the file is required.' });

  const project = await Project.findOne({ _id: req.params.id });
  if (!project) {
    return res.status(404).json({ "message": `No project matches ID ${req.params.id}.` });
  }
  console.log(project.aneksi)
  if (!project.aneksi.some(aneks => aneks == req.params.name)) {
    return res.status(404).json({ "message": `No aneks matches name ${req.params.name}.` });
  }

  fs.unlink(`${parentDir}/uploads/projects/${req.params.id}/aneksi/${req.params.name}`, async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ 'message': `Greska pri brisanju ${req.params.id}/aneksi/${req.params.name}` })
    }
    console.log(`File ${req.params.id}/aneksi/${req.params.name} has been deleted`);
    project.aneksi = project.aneksi.filter(aneks => aneks != req.params.name)
    const result = await project.save();
    return res.json( result );
  })

}

module.exports = {
  getAllAneksi,
  createNewAneks,
  deleteAllAneksi,
  getAneks,
  deleteAneks
}