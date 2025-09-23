const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: String,
    number: String,
    city: String,
    department: String,
    postalCode: String,
}, { _id: false });

const phoneSchema = new mongoose.Schema({
    type: { type: String, enum: ['Celular', 'Fijo', 'Trabajo'], default: 'Celular' },
    number: String,
}, { _id: false });

const favouriteSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    addedOn: { type: Date, default: Date.now },
}, { _id: false });

const cardSchema = new mongoose.Schema({
    cardNumber: {type: String, required: true},
    cardHolder: {type: String, required: true},
    expirationMonth: {type: Number, required: true},
    expirationYear: {type: Number, required: true},
    securityCode: {type:Number, required: true},
    type: {type: String, enum: ['Visa', 'MasterCard', 'AMEX'], required: true},
    bank: String,
    addedOn: {type: Date, default: Date.now},
}, {_id: false});

const historySchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' },
    date: { type: Date, default: Date.now },
    total: Number,
}, { _id: false });

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    firstName: String,
    middleName: String,
    firstSurname: String,
    secondSurname: String,
    birthDate: Date,
    phones: [phoneSchema],
    addresses: [addressSchema],
    cards: [cardSchema],
    favorites: [favouriteSchema],
    orders: [historySchema],
    role: { type: String, default: 'user' },
    active: { type: Boolean, default: true },
    avatar: String,
    verificationToken: String,
    resetPasswordToken: {type: String, default: null},
    resetPasswordExpires: {type: Date, default: null},
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
