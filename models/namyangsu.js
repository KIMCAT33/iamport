const mongoose = require('mongoose');

// 스키마 정의
const Schema = mongoose.Schema;

const Namyangsus = new Schema({
    phone: {
        type: String,
        trim: true,
        required: true,
    },
    name: {
        type: String,
        trim: true,
        required: true,
    },
    birth: {
        type: String,
        trim: true,
        required: true,
    },
    count: {
        type:Number,
        trim: true,
        default: 0,
    },
    randomNumber : {
        type: Number,
        trim: true,
        default : 10000
    },
    date : {
        type: Date,
        trim : true,
        default : new Date()
    },
    flag : {
        type: String,
        trim: true
    }
});

module.exports = mongoose.model('Namyangsus', Namyangsus)