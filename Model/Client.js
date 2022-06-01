const mongoose = require("mongoose");

const ClientIncomeDetailsSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        contact: { type: Number, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        incomePerAnnum: { type: Number, required: true },
        savingsPerAnnum: { type: Number, required: true }
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("ClientIncomeDetails", ClientIncomeDetailsSchema, "ClientIncomeDetails");