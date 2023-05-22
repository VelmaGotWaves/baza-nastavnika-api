const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const professorSchema = new Schema({
    ime: {
        type: String,
        required: true
    },
    prezime: {
        type: String,
        required: true
    },
    titula: {
        type: String,
        required: true
    },
    oblastiIstrazivanja: [{
        type: String
    }],
    katedre: [{
        type: String
    }],
    publikacije: [{
        type: String
    }],
    projekti: [{
        projekatId: {
            type: Schema.Types.ObjectId,
            ref: 'Project'
        },
        uloga: {
            type: String
        }

    }],
    tagovi: [{
        type: String
    }]
});

module.exports = mongoose.model('Professor', professorSchema);

