const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const professorSchema = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    title:{
        type: String,
        required: true
    },
    scientificResearch:[{
        type:String
    }],
    labaratories:[{
        type:String
    }],
    scientificProjects:[{
        type:String
    }],
    significantPublications:[{ 
        type:String
    }],
    tags:[{ 
        type:String
    }]
    
});

module.exports = mongoose.model('Professor', professorSchema);

