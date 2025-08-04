const vectorChunkSchema = new Schema({
  mpId: { type: mongoose.Schema.Types.ObjectId, ref: 'loksabhaMP', required: true },
  mpName: { type: String, required: true },
  constituency: { type: String, required: true },
  chunk: { type: String, required: true },
  embedding: { type: [Number], required: true },
  metadata: {
    articleUrl: String,
    title: String,
    type: String, 
    scrapedAt: Date
  }
}, { timestamps: true })

module.exports = model('loksabhaRAGChunks', vectorChunkSchema)
