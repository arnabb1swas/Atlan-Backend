// Mongoose Connection
require("dotenv").config();
const mongoose = require('mongoose');

module.exports = () => {
    mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log("Database Connected!");
        })
        .catch((err) => {
            console.log("Database Connection Failed!");
        });
    mongoose.connection.on('error', (err) => {
        console.log("Mongoose default connection has occured " + err + " error");
    });
    mongoose.connection.on('disconnected', () => {
        console.log("Mongoose connection is disconnected");
    });
}