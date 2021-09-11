require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const https = require("https");
const request = require("request");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const mnd = require(__dirname + "/db.js");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
// const md5 = require("md5");
// const encrypt = require("mongoose-encryption");


const _ = require("lodash");
// const router = express.Router();
const fs = require('fs');
var path = require('path');

const multer = require('multer');

// const nodemailer = require('nodemailer');
// require('dotenv/config');
const querystring = require('querystring');




const app = express();

// console.log(process.env.API_KEY);

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(express.static("public"));
app.set("view engine", "ejs");



app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());

app.use(passport.session());





mongoose.connect(mnd.dbCred, {useNewUrlParser: true, useUnifiedTopology: true});

// mongoose.set("useCreateIndex", true);


const tireSchema = new mongoose.Schema({
    brand: String,
    size: String,
    price: Number,
    car: String,
    img:
    {
        data: Buffer,
        contentType: String
    }
});

const Tire = mongoose.model('Tire', tireSchema);



const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    fname: String,
    lname: String
    // brand: String,
    // size: String,
    // price: Number,
    // qty: Number,
    // total: Number,
    // img:
    // {
    //     data: Buffer,
    //     contentType: String
    // }
});


userSchema.plugin(passportLocalMongoose);


// // userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const cartSchema = new mongoose.Schema({
    // _id: {type: mongoose.Schema.Types.ObjectId, ref: 'userSchema'},
    brand: String,
    size: String,
    price: Number,
    qty: Number,
    total: Number,
    uid: {type: mongoose.Schema.Types.ObjectId, ref: 'userSchema'}
});



const Cart = new mongoose.model("Cart", cartSchema);

const paySchema = new mongoose.Schema({
    total: Number,
    uid: {type: mongoose.Schema.Types.ObjectId, ref: 'userSchema'},
    fname: String,
    lname: String,
    email: String,
    pnum: Number,
    creditN: Number,
    date: String,
    code: Number,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    pdate: Date
});
  
const Payment = mongoose.model('Payment', paySchema);

const cbSchema = new mongoose.Schema({
    brand: String,
    size: String,
    price: Number,
    qty: Number,
    total: Number,
    uid: {type: mongoose.Schema.Types.ObjectId, ref: 'userSchema'}
});

  
const CB = new mongoose.model("CB", cbSchema);


const pbSchema = new mongoose.Schema({
    total: Number,
    uid: {type: mongoose.Schema.Types.ObjectId, ref: 'userSchema'},
    fname: String,
    lname: String,
    email: String,
    pnum: Number,
    creditN: Number,
    date: String,
    code: Number,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    pdate: Date
});

const PB = new mongoose.model("PB", pbSchema);



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },

    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

const upload = multer({storage: storage});


// app.post('/', upload.single('image'), function(req, res, next){

//     const obj = new Tire({
//         brand: req.body.brand,
//         size: req.body.size,
//         price: req.body.price,
//         car: req.body.car,
//         img: {
//             data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
//             contentType: 'image/jpg'

//         }
//     });

//     obj.save();
//     res.redirect("/");

// });

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});



app.post("/register", function(req, res){

    User.register({username: req.body.username, fname: req.body.fna, lname: req.body.lna}, req.body.password, function(err, user){
        if (err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");
            });
        }
    });
});


app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });


    req.login(user, function(err){
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");

            });
        }
    });
});


app.post("/reset", function(req, res){

    User.findOne({username: req.body.username}).then(function(foundUser){
        foundUser.setPassword(req.body.password, function(err, foundUser){
            if (!err){
                foundUser.save();
                res.redirect("/login");
            }
        });
    });
});


app.get("/reset", function(req, res){
    res.render("reset");
})


app.get("/", function(req, res){

    if (req.isAuthenticated()) {

        Tire.find({}, function(err, items){
            if (err) {
                console.log(err);
                res.status(500).send('An error occurec', err);
            } else {
                res.render('list', {items: items});
            }
        });
    } else {
        res.redirect("/login");
    }
});



app.get("/carts", function(req, res){

  Cart.find({uid: req.user.id}, function(err, cartss){
      if (err) {
          console.log(err);
          res.status(500).send('An error occurec', err);
      } else {

        const sh = _.sumBy(cartss, 'total');
        const sct = _.sumBy(cartss, 'qty');

        res.render('carts', {cartSh: cartss, cartTotal: sh, cartQ: sct});

      }
  });
});



app.post('/carts', function(req, res, next){

    const addT = req.body.addT;
    const qt = req.body.qt;
    const p = req.body.tp;
    const s = req.body.ts;
    const b = req.body.tb;
    const cr = req.body.tc;
    // console.log(qt);
  
        Tire.findById(addT, function(err, items){
          if (err) {
            console.log(err);
          } else {
            
            const cartA = new Cart({
                brand: items.brand,
                size: items.size,
                price: items.price,
                qty: qt,
                total: items.price * qt,
                uid: req.user.id
            });

            cartA.save();
            res.redirect("/");
        }
    });
});


app.post("/delete", function(req, res){

    const rmv = req.body.rmv;

    Cart.findByIdAndRemove(rmv, function(err, results){
        res.redirect("/carts");
    });
});


app.post("/update", function(req, res){

    Cart.findById(req.body.inc, function(err, pri){
        // console.log(pri.price);

    Cart.findByIdAndUpdate(req.body.inc, {$set: {qty: req.body.qu, total: req.body.qu * pri.price}}, function(err, resu){
        res.redirect("/carts");
    });
});
});



app.post('/details', function(req, res){
    const fSize = req.body.fSize;
  
    Tire.find({size: fSize}, function(err, items){
        if (items.length === 0 || err) {
            res.render("fail");
        } else {
            res.render("details", {items: items});
        }
    });
  });

  app.get("/fail", function(req, res){

    res.sendFile(__dirname + "/fail.html");

  });

  app.get("/detail", function(req, res){
      res.sendFile(__dirname + "/fail.html");
  });


app.post("/payment", function(req, res){

    const fname = req.body.fname;
    const lname = req.body.lname;
    const email = req.body.email;
    const pnum = req.body.pnum;
    const cnum = req.body.cnum;
    const date = req.body.date;
    const scode = req.body.scode;
    const adr = req.body.adr;
    const city = req.body.city;
    const state = req.body.state;
    const zcode = req.body.zcode;

    Cart.find({uid: req.user.id}, function(err, result){

        const ttl = _.sumBy(result, 'total');

        const pay = new Payment({
            total: ttl,
            uid: req.user.id,
            fname: fname,
            lname: lname,
            email: email,
            pnum: pnum,
            creditN: cnum,
            date: date,
            code: scode,
            address: adr,
            city: city,
            state: state,
            zipCode: zcode,
            pdate: new Date()
        });

        pay.save();
        res.redirect("/succ");
    });
});

app.get("/payment", function(req, res){

    Cart.find({uid: req.user.id}, function(err, result){

        const tl = _.sumBy(result, 'total');
        const q1 = _.sumBy(result, 'qty');

        Cart.find({uid: {$in: [req.user.id]}}, function(err, rst){
  
        res.render("payment", {payTotal: tl, qTotal: q1, items: rst});
    });
    });
});


app.get("/succ", function(req, res){

    Payment.find({uid: req.user.id, pdate: {$lt: new Date()}}, function(err, mresult){
        
        if(!err){
            res.render("succ", {oId: mresult});
        }
    });

});


app.post("/succ", function(req, res){

    Payment.find({uid: {$in: [req.user.id]}}, function(err, result){
        PB.insertMany(result, function(err, it){

            // console.log(it);

        });

        Payment.deleteMany({uid: {$in: [req.user.id]}}, function(err, rs){

        });
    });
        Cart.find({uid: {$in: [req.user.id]}}, function(err, items){

            // console.log(items);

            // const cartB = new CB({
            //     brand: items.brand,
            //     size: items.size,
            //     price: items.price,
            //     qty: items.qty,
            //     total: items.total,
            //     uid: req.user.id
            // });

            // cartB.save();
            CB.insertMany(items, function(err, resu){
                // console.log(resu);
            });
            Cart.deleteMany({uid: {$in: [req.user.id]}}, function(err){
            });
        });
        res.redirect("/")
});



app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/login");

});


app.get("/about", function(req, res){
    res.render("about");
});

app.get("/contact", function(req, res){
    res.render("contact");
});











app.listen(process.env.PORT || 3000, function(){
    console.log("Server started successfully");
});


