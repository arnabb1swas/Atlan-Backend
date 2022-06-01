require('dotenv').config();
const { urlencoded } = require('express');
const fast2sms = require('fast-two-sms');
const translate = require("translate");
const Connection = require('./DB/DB');
const fastcsv = require("fast-csv");
const express = require('express');
const fileSystem = require("fs");
const app = express();

const ClientIncomeDetails = require('./Model/Client');
const PORT = process.env.PORT || 5000;
Connection();

// Middlewares
app.use("/public", express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function validateData(req, res, next) {
    const { clientIncomePerAnnum, clientSavingsPerAnnum, clientContact } = req.body;
    if (clientIncomePerAnnum < clientSavingsPerAnnum) {
        res.send("Invalid Data Savings cannot be more than Income");
    }
    else if (isNaN(clientContact)) {
        res.send("Invalid mobile number, only digits are acceptable");
    }
    else if (clientContact.length !== 10) {
        res.send(clientContact.length + "Invalid mobile number, should be of 10 digits");
    }
    next();
};

//Routes
app.get("/", (req, res) => {
    res.send("Atlan Assignment Daisy");
})

// Find slang in local language - task 1
app.get('/getSlang', async (req, res) => {
    try {
        // can use ip to detect region/state and get language automatically instead in passing it manually was trying by using axios or https etc
        //  ip = https://api.ipify.org?format=json // to get ip
        // locDetail = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon` // to get location details
        // e.g. req.query.lang = 'hi' (Hindi) // this step can be automated
        // req.query.word = "Hello" (English - auto detection) // this step can be automated
        const text = await translate(req.query.word, req.query.lang);
        res.json({
            success: true,
            data: text
        });
    }
    catch (err) {
        res.json({
            success: false,
            data: err
        });
    }
});

// Validate while insertion of a new client details - task 2
app.post('/validateNew', validateData, async (req, res) => {
    try {
        const { clientEmail, clientName, clientContact, clientIncomePerAnnum, clientSavingsPerAnnum } = req.body;
        const newClient = await new ClientIncomeDetails({
            name: clientName,
            contact: parseInt(clientContact),
            email: clientEmail,
            incomePerAnnum: clientIncomePerAnnum,
            savingsPerAnnum: clientSavingsPerAnnum,
        }).save();
        res.json({
            success: true,
            data: newClient
        });
    } catch (err) {
        res.json({
            success: false,
            data: err
        });
    }
});

// Validate all and send invalid data to data collector - task 2
app.get('/validateAll', async (req, res) => {
    try {
        let inValidData = await ClientIncomeDetails.find({ $expr: { $gt: ["$savingsPerAnnum", "$incomePerAnnum"] } }).lean().exec();
        if (inValidData.length == 0) {
            res.json({ success: true, message: "All records are Valid" })
        } else {
            res.json({ success: true, message: "All Invalid Records", data: inValidData })
        }
    } catch (err) {
        res.json({
            success: false,
            data: err
        });
    }
});

// Get data into csv - task 3
app.get('/getCsv', async (req, res) => {
    try {
        let clients = await ClientIncomeDetails.find().select("name contact email incomePerAnnum savingsPerAnnum").lean().exec();
        let file = fileSystem.createWriteStream("./public/client.csv");
        fastcsv.write(clients, { headers: true })
            .on("finish", () => {
                res.send("<a href='./public/client.csv' download='client.csv' id='download-link'>Download</a><script>document.getElementById('download-link').click();</script>");
            }).pipe(file);

    } catch (err) {
        res.json({
            success: false,
            data: err
        });
    }
});


// Send Message - task 4
app.post('/sendMessage', async (req, res) => {
    try {
        const { clientEmail, clientName, clientContact, clientIncomePerAnnum, clientSavingsPerAnnum } = req.body;
        const msg = `Your Details :\n Email ID :${clientEmail}\n Name : ${clientName}\n Income Per Annum: ${clientIncomePerAnnum}\n Savings Per Annum: ${clientSavingsPerAnnum}\n Contact : ${clientContact}\n Thankyou for your response`;
        const options = { authorization: process.env.SMSAPIKEY, message: msg, numbers: [clientContact] };
        const sms = await fast2sms.sendMessage(options);
        res.json({ success: true, data: sms })
    } catch (err) {
        res.json({
            success: false,
            message: "Failed to send SMS to the Client",
            data: err
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
})