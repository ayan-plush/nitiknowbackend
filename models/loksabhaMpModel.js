// {
//     "mp_election_index": 180006,
//     "mp_name": "Bhupathiraju Srinivasa Varma",
//     "nature_membership": "Elected",
//     "term_start_date": "09-06-2024", convert to ISO 
//     "term_end_date": "In Office",
//     "term": "First Term",
//     "pc_name": "Narsapuram",
//     "state": "Andhra Pradesh",
//     "mp_political_party": "Bharatiya Janata Party",
//     "mp_gender": "Male",
//     "educational_qualification": "Post Graduate and above",
//     "educational_qualification_details": "M.A. (Politics) 1999 from Andhra University",
//     "mp_age": 57,
//     "debates": "",
//     "private_member_bills": "",
//     "questions": "",
//     "attendance": "",
//     "mp_note": "This MP is a minister. Ministers represent the government in debates, so we do not report their participation.  They do not sign the attendance register, ask questions, or introduce private member bills. Data corresponds to the period from 24-06-2024 to 04-04-2025.",
//     "national_average_debate": "",
//     "national_average_pmb": "",
//     "national_average_questions": "",
//     "attendance_national_average": "",
//     "state_average_debate": "",
//     "state_average_pmb": "",
//     "state_average_questions": "",
//     "attendance_state_average": "",
//     "mp_house": "Lok Sabha"
//   },


const {Schema, model} = require('mongoose')

const loksabhaMPSchema = new Schema({
    name : {
        type: String,
        required: true,
    },
    electionIndex : {
        type: Number,
        required: true,
    },
    startDate : {
        type: Date,
        required: true,
    },
    endDate : {
        type:   Date,
    },
    termCount : {
        type: String,
        required: true,
    },
    pcName : {
        type: String,
        required: true,
    },
    state : {
        type: String,
        required: true,
    },
    imageUrl : {
        type: String
    },
    fallbackUrl : {
        type: String
    },
    politicalParty : {
        type: String,
        required: true,
    },
    gender : {
        type: String,
        required: true,
    },
    lastScrapedAt: { 
        type: Date,
        default: null
    },
    education : {
        type: Object,
        default: {
            educational_qualification: "",
            educational_qualification_details: ""
        },
    }
},{timestamps: true})

loksabhaMPSchema.index({
    state: 'text',
    pcName: 'text',
    name: 'text',
},{
    weights: {
        state:5,
        pcName:4,
        name:3
    }
})

module.exports = model('loksabhaMP', loksabhaMPSchema)