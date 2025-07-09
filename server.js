const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const http = require('http')
const { dbConnect } = require('./utils/db')
const server = http.createServer(app)
require('dotenv').config()


// const CORSBASE = process.env.BASE_URL
// console.log('CORSBASE:', process.env.BASE_URL);


app.use(cors({
    origin : ['http://localhost:5173'] , //[`${CORSBASE}`],  idk if this is good tho process.env.BASE_URL 
    methods : "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials : true
}))

app.use(bodyParser.json())
app.use('/api', require('./routes/geoRoutes'))
app.get('/',(req,res)=>res.send('My backend'))
const port = process.env.PORT 
dbConnect();
server.listen(port, ()=> console.log(`server is running on PORT ${port}`))
