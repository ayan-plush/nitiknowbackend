const {Schema, model, default: mongoose} = require('mongoose')

const loksabhaArticlesSchema = new Schema({
  politician: { type: mongoose.Schema.Types.ObjectId, ref: 'loksabhaMP', required: true },
  title: { type: String, required: true },
  politicianName: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  description: { type: String },
  text: { type: String },
  img: { type: String },
  processed: {type: Boolean, defualt: false},
//   publishedAt: { type: Date },
  scrapedAt: { type: Date, default: Date.now }
},{timestamps: true})

loksabhaArticlesSchema.index({
    title: 'text',
    description: 'text',
},{
    weights: {
        title:5,
        description:4
    }
})

module.exports = model('loksabhaArticles', loksabhaArticlesSchema)