/*
Make a To-Do List and Notes App in the Home Page
Single login for both
*/

const express = require('express');
const app = express();
const mongoose = require("mongoose")
const bodyParser = require('body-parser');
const dateMethod = new Date();
const _ = require('lodash')
const monthArray = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const dayArray= ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
let port = process.env.PORT;

let listItems = []
let listArray = []
let message = "Page Not Found"
let link = "/login"
let route = "Login"
let val = 0

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public", {root:__dirname}));

app.set("view engine", "ejs");

mongoose.connect("mongodb+srv://admin-sid:qwerty1234@to-do-list.iagyga1.mongodb.net/notesDB")

//Schema Initialization
const itemSchema = {
    name: String,
}

const userSchema = {
    name:String,
    items: [itemSchema]
}

const accountSchema = {
    name:String,
    accName:String,
    password:String
}

//Initializing the Models
const User = mongoose.model("User", userSchema)

const Item = mongoose.model("Item", itemSchema)

const Account = mongoose.model("Account", accountSchema)

//Default Items
const Item1 = new Item({
    name:"Welcome to Your Personalized To-Do List"
})

const Item2 = new Item({
    name:"Type your entry and hit enter to add it to your list"
})

const Item3 = new Item({
    name:"<-- Click this to delete an Item"
})

const defaultItems = [Item1, Item2, Item3]

const addDefaultItem = function (userName, defaultItems) {
    User.findOneAndUpdate({name:userName}, {$push:{items:defaultItems}}, function(err, result){
        if(err){
            console.log("Error 404")
        }else{
            console.log("Success");
        }
    })
};

const dateData = function(){
    const date = []
    let optionDay = {
        weekday: "long",
    }
    let optionDate = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    }
    let dayShort = dateMethod.toLocaleDateString("en-US", optionDay);
    let dayLong = dateMethod.toLocaleDateString("en-US", optionDate);
    date.push(dayShort)
    date.push(dayLong)
    return date
}

app.get("/", function (req, res) {
    res.redirect("/login")
})

app.get("/login", function(req, res){
    Account.findOne({accName:"admin"}, function(err, data){
        if(!data){
            const admin = new Account({
                name:"Admin",
                accName:"admin",
                password:"admin"
            })
            admin.save()
        }
    })
    res.render("login")
})

app.get("/signup", function(req, res){
    res.render("signup")
})

app.post("/login", function(req, res){
    const user = req.body.usernameLogin
    const password = req.body.passwordLogin
    Account.findOne({accName:user, password:password}, function(err, data){
        if(!data){
            console.log("Account Not Found. Please Sign-Up");
            message = "Account Not Found."
            link = "/signup"
            route = "Sign-Up"
            val = 1
            res.redirect("/error")
        }else{
            res.redirect("/"+data.name)
        }
    })
    
})

app.post("/signup", function(req, res){
    const user = req.body.usernameSignUp
    const accountName = req.body.accountNameSignUp
    const password = req.body.passwordSignUp
    Account.findOne({accName:accountName}, function(err, data){
        if(data){
            console.log(data)
            console.log("Sorry. User Name is taken. Please Choose another name")
            message = "User Name is taken."
            link = "/signup"
            route = "Sign-Up"
            val = 2
            res.redirect("/error")
        }else{
            const account = new Account({
                name:user,
                accName:accountName,
                password:password
            })
            account.save().then(function(){
                res.redirect("/login")
            })
        }
    })
})

app.get("/error", function(req, res){
    res.render("error",{message:message, link:link, route:route, val:val})
})

app.get("/:name", function(req, res){
    const userName = _.startCase(req.params.name)
    User.findOne({name:userName}, function(err, data){
        if(err){
            console.log("Error");
        }else{
            if(!data){
                console.log("Data Not Found");
                const person = new User({
                    name:userName, 
                    items: defaultItems
                })
                person.save().then(function(){
                    res.redirect("/" + userName)
                })
            }else{
                let arr = dateData()
                User.findOne({name:userName}, function(err, values){
                    if(values.items.length === 0){
                        addDefaultItem(userName, defaultItems)
                    }
                    res.render("list",{dayShort : arr[0], dayLong: arr[1], listEntry : values.items, user:userName})
                })
            }
        }
    })
})

app.post("/:name",function(req, res){
    const data = req.body.entry
    const userName = _.startCase(req.params.name)
    console.log("Adding entry for: " + userName)
    if (data.length >= 1) {
        const newItem = new Item({
            name: data
        })
        User.findOne({name:userName}, function(err, data){
            data.items.push(newItem)
            data.save().then(function(){
                res.redirect("/" + req.params.name)
            })
        })
    }else{
        res.redirect("/" + req.params.name)
    }
})

app.post("/:name/delete", function(req, res){
    const check = req.body.delete
    const userName = req.params.name
    User.findOneAndUpdate({name: userName}, {$pull:{items:{_id:check}}}, function(err, result){
        if(!err){
            res.redirect("/" + userName)
        }
    })
})

if(port == null || port == ""){
    port = 3000
}

app.listen(port, function(){
    console.log("Server Started Successfully");
})
