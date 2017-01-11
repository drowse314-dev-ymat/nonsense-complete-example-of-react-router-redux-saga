'use strict';

const express = require('express');


const app = express();
app.use(express.static('dist'));


app.listen(3000, '127.0.0.1');