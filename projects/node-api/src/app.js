const express = require('express');
const usersRoutes = require('./routes/users.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', usersRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando' });
});

module.exports = app;

