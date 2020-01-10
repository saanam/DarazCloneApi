const mongoose=require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtSecret = "0123456789abcdefghijklmnopqrstuvwxyz";
const UserSchema=new mongoose.Schema({
    mobileNumber:{
        type:Number,
        required:true,
        minlength:10,
        index:true,
        unique:true,
        trim:true
    },
    smsCode:{
        type:Number,
        required:true,
        minlength:4,
        trim:true
    },
   fullName:{
       type:String,
       required:true,
       minLength: 3,
       trim:true
   },
    email:{
       type:String,
        unique:true,
        index: true,
        required:true,
        trim:true
    },
    password:{
        type: String,
        required: true,
        minLength:5,
        trim: true
    },
    image:{
        type:String
    }
});

//user authentication
UserSchema.statics.verifyUser = (req, res, next) => {
    let authHeader = req.headers.authorization;
    if (!authHeader) {
        let error = new Error('Bearer token is not set');
        error.status = 401;
        return next(err);
    }
    let token = authHeader.split(' ')[1];
    let data;
    try {
        data = jwt.verify(token, jwtSecret);
    } catch (err) {
        throw new Error('Token could not be verified!');
    }
    User.findById(data._id)
        .then((user) => {
            req.user = user;
            next();
        })
}

const User=mongoose.model('Users',UserSchema);
module.exports={User};
