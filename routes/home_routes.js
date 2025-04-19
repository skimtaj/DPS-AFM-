const express = require('express');
const route = express.Router();
const { home, enquiry } = require('../controllers/home_controllers')

route.get('/DPS', home)

route.post('/DPS/enquiry', enquiry)

module.exports = route; 
