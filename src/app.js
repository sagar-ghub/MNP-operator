const express = require("express");
const path = require("path");
// const knexdb = require("./db");
const fileUpload = require("express-fileupload");
const { createHandler } = require("graphql-http/lib/use/express");
const { schema } = require("./graphql/graphqlSchema");

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/rkit", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// const requestHeader = require('./middlewares/requestHeader');
const mobilePlan = require("./routes/mobilePlan");
const csvupload = require("./routes/csvUploads");
const paytmApi = require("./routes/paytmApi");
const userApi = require("./routes/userRoutes");
const walletApi = require("./routes/transactionRoutes");
const requireAuth = require("./middlewares/requireAuth");
const billfetch = require("./routes/billFetch");
const euronet = require("./routes/euroNetBill");
const app = express();
// app.use(express.static(path.join(__dirname, '../public')));
// app.use(requestHeader);
app.use(express.json());
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));

// app.use(requireAuth("api"));

app.all("/graphql", createHandler({ schema }));
//add router
app.use("/mobile", mobilePlan);
app.use("/csv", csvupload);
app.use("/paytm", paytmApi);
app.use("/auth", userApi);
app.use("/wallet", walletApi);
app.use("/billfetch", billfetch);
app.use("/recharge", euronet);

//for testing
// const testRoute = require("./routes/testRoute");
// app.use("/test", testRoute);

app.get("/", async (req, res) => {
  try {
    let { status = 200 } = req.query;
    return res.status(status).json({ error: 0, msg: "hello world" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ error: 0, msg: "hello world2" });
  }
});

// 404
app.use((req, res, next) => {
  return res
    .status(404)
    .json({ error: 1, msg: "request page " + req.url + " Not found." });
});

// 500 - Any server error
app.use((err, req, res, next) => {
  console.error(err.stack);
  return res.status(500).json({ error: 1, msg: "Something broke!" });
});

module.exports = app;
