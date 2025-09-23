const express = require('express');
const { categories } = require('../data/categories');

const api = express.Router();

api.get('/menu', (req, res) => {
    res.json(categories);
});

module.exports = api;
