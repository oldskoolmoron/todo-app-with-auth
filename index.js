//load enviroment variables
require('dotenv').config();

const express = require("express");
const { UserModel, TodoModel } = require("./db");
const { auth } = require("./auth");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const { z } = require('zod');

// Connecting to MongoDB without useNewUrlParser and useUnifiedTopology
// These options were required in older versions of the MongoDB driver.
// Since version 4.0.0, these options are enabled by default and specifying them is unnecessary.

mongoose.connect(process.env.MONGODB_URI,{ 
    // useNewUrlParser: true,
    // useUnifiedTopology: true 
}).then(()=>{
    console.log("connected to MongoDB");
}).catch((error) => {
    console.error("MongoDB connection error:", error.message);
})

const app = express();
app.use(express.json());

app.post("/signup", async function(req, res) {
    const requiredBody = z.object({
        email: z
        .string()
        .min(3,{message:"Email must be at least 3 characters long"})
        .max(100,{message:"Email cannot exceed 100 characters"})
        .email({message:"Must be a valid email address"})
        .refine((value)=> value.endsWith("@mail.com"), {
            message:"Email must end with @mail.com"
        }),
        name: z
        .string()
        .min(7,{message:"Name must be at least 7 characters long"})
        .max(100, {message:"Name cannot exceed 100 characters"}),
        password: z
        .string()
        .min(8, {message:"Password must at least 8 characters long"})
        .max(15, {message:"Password cannot exceed 15 characters"})
        .regex(/[A-Z]/, {message:"Password must contain at least one uppercase letter"})
        .regex(/[a-z]/, {message:"Passowrd must contain at least one lowercase letter"})
        .regex(/[0-9]/, {message:"Password must contain at least one number"})
        .regex(/[@#!$?&]/, {message:"Password must contain at least one special character"})
    })
    // const parsedData = requiredBody.parse(req.body); //or
    const parsedDatawithSuccess = requiredBody.safeParse(req.body);  

    if(!parsedDatawithSuccess.success){
        res.json({
            message : "Incorrect format",
            error: parsedDatawithSuccess.error
        })
        return 
    }

    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    try{
        const ifuseralreadyexist = await UserModel.findOne({email : email});
        if(ifuseralreadyexist){
           return res.json({
                message:"user already exists!"
            })
        }
        //input validation
        if(typeof email!== "string" || email.length < 5 || !email.includes("@")) {
           return res.json({
                message: "Email incorrect"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 5);
        await UserModel.create({
        email: email,
        password: hashedPassword,
        name: name
        });

        return res.json({
            message: "You're signed up!"
        })
    }
    catch(e){
        return res.status(500).json({
            message:"An error occured",
            error : e.message
        })
    }
});


app.post("/signin", async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    const response = await UserModel.findOne({
        email: email
    });
    if(!response){
        res.status(403).json({
            message: "User does not exist in our DB."
        })
        return 
    }
    const passwordMatched = await bcrypt.compare(password,response.password);

    if (passwordMatched) {
        const token = jwt.sign({
            id: response._id.toString()
        }, process.env.JWT_SECRET);

        res.json({
            token
        })
    } else {
        res.status(403).json({
            message: "Incorrect creds"
        })
    }
});


app.post("/todo", auth, async function(req, res) {
    const userId = req.userId;
    const title = req.body.title;
    const done = req.body.done;

    await TodoModel.create({
        userId,
        title,
        done
    });

    res.json({
      userId: userId,
        message: "Todo created"
    })
});


app.get("/todos", auth, async function(req, res) {
    const userId = req.userId;

    const todos = await TodoModel.find({
        userId
    });

    res.json({
        todos
    })
});

app.listen(3000,()=>{
  console.log("server is running on port 3000");
});