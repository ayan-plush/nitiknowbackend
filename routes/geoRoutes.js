const geoController = require('../controllers/geoController')

const router = require('express').Router()

router.get('/const', geoController.getConstituency);
router.get('/assembly', geoController.getAssemblyConstituency);
router.get('/lok', geoController.getLokSabhaMember);
router.get('/news', geoController.getNewsDataModule);
router.post('/articles', geoController.scrapeMinisterNews);
router.post('/image', geoController.sabhaMemberImageAdd);
router.post('/add', geoController.sabhaMemberDataAdd);


module.exports = router