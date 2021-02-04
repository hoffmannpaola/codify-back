/* eslint-disable no-unused-vars */
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

require('./utils/loadRelationships');

const { verifyJWT } = require('./midllewares/validation');
const coursesRouter = require('./routers/coursesRouter');
const adminRouter = require('./routers/admin/adminRouter');
const usersRouter = require('./routers/usersRouter');
const NotFoundError = require('./errors/NotFoundError');
const WrongPasswordError = require('./errors/WrongPasswordError');


app.use('/courses', verifyJWT, coursesRouter);
app.use('/admin', adminRouter);
app.use('/users', usersRouter);

app.use((error, req, res, next) => {
  console.log(error);

  if (error instanceof NotFoundError) res.status(404).send(error.message);
  else if (error instanceof WrongPasswordError) res.status(401).send(error.message);
  else res.status(500).json(error);
});

module.exports = app;
