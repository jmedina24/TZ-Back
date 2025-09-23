const mongoose = require('mongoose');
const app = require('./app');
require('dotenv').config();

const dbUser = process.env.DB_USER;
const dbPass= process.env.DB_PASS;
const dbHost = process.env.DB_HOST;
const ipServer = process.env.IP_SERVER;
const apiVersion = process.env.API_VERSION;
const port = 3977;

const connectDB = async () => {
    try{
        await mongoose.connect(`mongodb+srv://${dbUser}:${dbPass}@${dbHost}/`);
        app.listen(port, () => {
            console.log('================================');
            console.log('=========== API REST ===========');
            console.log('================================');
            console.log(`http://${ipServer}:${port}/api/${apiVersion}`);
        })
    } catch (error) {
        console.log('Error al conectar con la base de datos...', error);
    }
}

connectDB();