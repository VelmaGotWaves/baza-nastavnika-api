const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    nazivProjekta: {
        type: String,
        required: true
    },
    vrstaProjekta:{
        type:String
    },
    programFinansiranja:{
        type:String
    },
    nazivPrograma: {
        type: String
    },
    referentniBroj:{
        type:String
    },
    interniBroj:{
        type:String
    },
    rukovodilac:{
        type: Schema.Types.ObjectId,
        ref:'Professor'
    },
    administrator:{
        type: Schema.Types.ObjectId,
        ref:'Professor'
    },
    profitniCentar:{
        type:String
    },
    planiraniPocetak:{
        type:Date
    },
    planiraniZavrsetak:{
        type:Date
    },
    trajanje:{
        type:String
    },
    ukupanBudzet:{
        type:String
    },
    budzetZaFon:{
        type:String
    },
    opis:{
        type:String
    },
    ciljevi:{
        type:String
    },
    partnerskeInstitucije:{
        koordinator:{
            type:String
        },
        partneri:[{
            type:String
        }]
    },
    clanoviProjektnogTima:[{
        type: Schema.Types.ObjectId,
        ref:'Professor'
    }],
    website:{
        type:String
    },
    kljucneReci:[{
        type:String
    }],
    ugovor:{
        type:String
    },
    aneksi:[{
        type:String
    }]

    
});

module.exports = mongoose.model('Project', projectSchema);

