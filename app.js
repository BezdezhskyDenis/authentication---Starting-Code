require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const PORT = process.env.PORT || 3000;
const myDB = process.env.MY_DB;
const userDB = process.env.DB_USER;
const passDB = process.env.DB_PASS;

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret:"our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

main().catch((err) => console.log(err));

async function main() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(
    `mongodb+srv://${userDB}:${passDB}@cluster0.hjevao3.mongodb.net/${myDB}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
}

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

// secret route ------------------------------------------------------------

app.route('/secrets')

.get((req, res) =>{
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect('/login')
    }
})
//--------------------------------------------------------------------------


// login route --------------------------------------------------------------

app.route('/login')
.get((req, res) => {
  res.render("login");
})
.post((req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) =>{
        if(err){
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, () =>{
                res.redirect("/secrets");
            })
        }
    })
})


//---------------------------------------------------------------------------

// register route -----------------------------------------------------------
app.route("/register")

.get((req, res) => {
    res.render("register");
  })

.post((req, res) =>{

    User.register({username: req.body.username}, req.body.password, (err, user) =>{
        if(err){
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req, res, () =>{
                res.redirect("/secrets");
            })
        }
    })
})
//---------------------------------------------------------------------------

app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });




app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
