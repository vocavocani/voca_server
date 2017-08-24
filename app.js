'use strict';
const express = require('express');
const path = require('path');

const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();


if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

require('./routes')(app);

// error handler
require('./ErrorHandler')(app);


const PORT = 3000;
app.listen(PORT, () => {
  console.info(`[VOCAVOCANI] Listening on Port ${PORT}`);
});

module.exports = app;
