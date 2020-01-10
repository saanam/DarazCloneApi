const express = require('express');
const app = express();
const {mongoose} = require('./database/mongoosedb');
const bodyParser = require('body-parser');
const bcrypt=require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require("path");

const {User} = require('./model/users');
const {Product}=require('./model/products');
const port = 3000;
const saltRounds=10;
const jwtSecret = "0123456789abcdefghijklmnopqrstuvwxyz";

app.use('/images',express.static(__dirname+'/images/products'));
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}));

app.use(function (req,res,next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods","GET,POST,HEAD,OPTIONS,PUT,PATCH,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/',(req,res,) =>{
    res.send("Daraz Api")

});

app.post('/user/signup', (req, res, next) => {
    let password = req.body.password;
    bcrypt.hash(password, saltRounds, (error, hash)=> {
        if (error) {
            let error =  new Error('Could not hash!');
            error.status = 500;
            return next(err);
        }
        User.create({
            mobileNumber: req.body.mobileNumber,
            smsCode: req.body.smsCode,
            fullName: req.body.fullName,
            email: req.body.email,
            password:hash,
            image: req.body.image
        }).then((user) => {
            let token = jwt.sign({ _id: user._id }, jwtSecret);
            res.json({ status: "Signup success!", token: token });
        }).catch(next);
    });
});

app.get('/user/list',(req,res)=>{
    User.find({

    }).then((users)=>{
        res.send(users);
    }).catch((e)=>{
        res.send(e);
    })
});

app.post('/user/login', (req, res, next) => {
    User.findOne({ mobileNumber: req.body.mobileNumber })
        .then((user) => {
            if (user == null) {
                let err = new Error('User not exist');
                err.status = 401;
                return next(err);
            } else {
                bcrypt.compare(req.body.password, user.password)
                    .then((isCorrectPassowrd) => {
                        if (!isCorrectPassowrd) {
                            let err = new Error('Wrong Password');
                            err.status = 401;
                            return next(err);
                        }
                        let token = jwt.sign({ _id: user._id }, jwtSecret);
                        res.json({ status: 'Login Successfully', token: token });
                    }).catch(next);
            }
        }).catch(next);
});

app.get('/product/list',(req,res)=>{
    Product.find({}).then((productList)=>{
        res.send(productList);
    }).catch((e)=>{
        res.send(e);
    })
});

const storage = multer.diskStorage({
    destination: "./images/products",
    filename: (req, file, callback) => {
        let ext = path.extname(file.originalname);
        callback(null, `${file.fieldname}-${Date.now()}${ext}`);
    }
});

const imageFileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error("You can upload only image files!"), false);
    }
    cb(null, true);
};
const upload = multer({
    storage: storage,
    fileFilter: imageFileFilter
});

app.post('/save/product',upload.single('productImage'),(req,res)=>{
    let newProduct = new Product({
        productName:req.body.productName,
        price:req.body.price,
        description:req.body.description,
        specification:req.body.specification,
        delivery:req.body.delivery,
        services:req.body.services,
        productImage:req.file.filename
    });
    newProduct.save().then((productDoc)=>{
        res.send(productDoc);
    });
});

app.get('/user/me', User.verifyUser, (req, res, next) => {
    res.json({ _id: req.user._id, mobileNumber: req.user.mobileNumber, fullName: req.user.fullName, email: req.user.email,
        image: req.user.image });
});

app.listen(port,()=>{
    console.log(`server is listening in port ${port}`);
});

