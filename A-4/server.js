const express = require("express");
const rentalData = require("./models/rentals-db");
const path = require("path");
const app = express();
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
require("dotenv").config();

const HTTP_PORT = process.env.PORT || 8000;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USERNAME,
    pass: process.env.PASSWORD,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
    },
  })
);

app.set("view engine", ".hbs");

app.use(bodyParser.json());

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(express.static("public"));
app.use(function (req, res, next) {
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = route == "/" ? "/" : route.replace(/\/$/, "");
  next();
});

app.get("/", (req, res) => {
  const data = rentalData
    .getFeaturedRentals()
    .then((data) => {
      res.render("home", { rentals: data });
    })
    .catch((err) => {
      res.render("home", { message: err });
    });
});

app.get("/rentals", (req, res) => {
  const data = rentalData
    .getRentalsByCityAndProvince()
    .then((data) => {
      res.render("rental", { rentals: data });
    })
    .catch((err) => {
      res.render("rental", { message: err });
    });
});

app.get("/sign-up", (req, res) => {
  res.render(path.join(__dirname + "/views/signup.hbs"));
});

app.get("/log-in", (req, res) => {
  res.render(path.join(__dirname + "/views/login.hbs"));
});

app.get("/we/come", (req, res) => {
  res.render(path.join(__dirname + "/views/welcome.hbs"));
});

app.post("/sign-up", (req, res) => {
  const { email, lname, fname, password } = req.body;
  const data = {
    email:
      email === "" || !email.match(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/)
        ? "Please enter a valid email address"
        : "",
    password:
      password === "" ||
      !password.match(
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,12}$/
      )
        ? "Please enter valid password"
        : "",
    fname: fname === "" ? "Please enter your first name" : "",
    lname: lname === "" ? "Please enter your last name" : "",
  };
  if (
    data.email === "" &&
    data.fname === "" &&
    data.lname === "" &&
    data.password === ""
  ) {
    res.render("welcome", { user: `${fname} ${lname}` });

    const mailConfigurations = {
      from: process.env.EMAIL,
      to: email,
      subject: "Registration",
      html: `<h2>Hi! ${fname} ${lname}</h2> <h5> Welcome to our site</h5>`,
    };

    transporter.sendMail(mailConfigurations, function (error, info) {
      if (error) console.log("Something went wrong");
      else {
        console.log("Email Sent Successfully");
        console.log(info);
      }
    });
  } else {
    res.render("signup", { message: data, data: req.body });
  }
});

app.post("/log-in", (req, res) => {
  const { email, password } = req.body;
  const data = {
    email: email === "" ? "Please enter a valid email address" : "",
    password: password === "" ? "Please enter your password" : "",
  };
  res.render("login", { message: data, data: req.body });
});

// app.use((req, res) => {
//     res.status(404).render(path.join(__dirname + "/views/404.hbs"));
//     res
// })

rentalData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("server listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });
