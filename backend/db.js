const { Client } = require("pg");
require("dotenv").config();

const con = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

con
  .connect()
  .then(() => console.log("DB connected"))
  .catch((err) => console.log(err));

module.exports = con;
