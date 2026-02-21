const express = require('express');
require("dotenv").config();
const db = require('./configs/database');
const authRoute = require('./routes/authRoutes');
const Port = process.env.Port

const app = express();
app.use(express.json());

//auth API
app.use('/auth',authRoute);

app.listen(Port, ()=> {
    console.log(`server is running on port ${Port} `)
})





