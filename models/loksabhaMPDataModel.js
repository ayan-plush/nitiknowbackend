const {Schema, model, default: mongoose} = require('mongoose')

const loksabhaMPDataSchema = new Schema({
  politician: { type: mongoose.Schema.Types.ObjectId, ref: 'loksabhaMP', required: true },
  politicianName: { type: String, required: true },
  assetsData: { type: Array },
  criminalCases: { type: String},
  debates: { type: Array },
  scrapedAt: { type: Date, default: Date.now }
},{timestamps: true})

// loksabhaMPDataSchema.index({
//     title: 'text',
//     description: 'text',
// },{
//     weights: {
//         title:5,
//         description:4
//     }
// })

module.exports = model('loksabhaMPData', loksabhaMPDataSchema)