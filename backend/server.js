const express = require("express");
const app = express();
const homeroute = require("./routes/route");
require("./db"); // DB bağlantısı burada başlayır

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", homeroute);

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
