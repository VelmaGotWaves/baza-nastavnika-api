const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    nazivProjekta: {
        type: String,
        required: true
    },
    nazivPrograma: {
        type: String
    },
    referentniBroj:{
        type:String
    }
    
});

module.exports = mongoose.model('Project', projectSchema);

