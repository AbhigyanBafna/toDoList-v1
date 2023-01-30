const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ =  require('lodash');

const app = express();

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));
//For static images/styles etc.
app.use('/public',express.static('public'));

mongoose.set('strictQuery', true); //Avoids Deprecation Warning.
mongoose.connect("mongodb+srv://Abhi:Test123@cluster0.msqsp6a.mongodb.net/toDoListDB", { useNewUrlParser: true}); //Connects to DB.

//Schema and model for main list.
const itemsSchema = {
    name : String
};
const Item = mongoose.model("Item", itemsSchema);

//Default array items.
const item1 = new Item({
    name: "Play PS5"
})
const item2 = new Item({
    name: "Learn MERN"
})
const item3 = new Item({
    name: "Watch a Marvel movie."
})

//Default array.
const defaultItems = [item1, item2, item3];

//Main route function.
app.get("/",function(req,res){

    //Finds array of items and displays them or loads default list when opening the first time.
    Item.find({}, function(err, foundItems){
        //Logs Errors
        if(err){
            console.log(err);
        }
        //Executes when starting for the first time.
        else if(foundItems.length === 0){
            Item.insertMany(defaultItems); //Inserts default items
            res.redirect("/"); //Redirects to this route and executes else block.
        }
        //Renders list with pre-existing items.
        else{
            res.render("lists", {
                listTitle: "Today",
                newItems: foundItems
            });
        }
    })

});

//Schema and Model for a new custom list.
const cListSchema = {
    name: String,
    items: [itemsSchema]
};
const List = mongoose.model("List", cListSchema);

//Creates a custom list based on the end path entered by user.
app.get("/:listName", function(req,res){
    const listName = _.capitalize(req.params.listName); //Stores the end path entered by user.

    //Finds array of items and displays them or loads default list when opening the first time.
    List.findOne({name:listName}, function(err, foundList){
        if(!err){
            if(!foundList){
                //Executes when starting for the first time.
                const list = new List({
                    name: listName,
                    items: defaultItems
                });
            
                list.save();
                res.redirect("/" + listName);
            }else{
                //Renders list with pre-existing items.
                res.render("lists", {
                    listTitle: foundList.name,
                    newItems: foundList.items
                });
            }
        }
    })

    
})

//Saves new items entered by user to DB.
app.post("/",function(req,res){

    const itemName = req.body.newItem; //Gets the entered text by user.
    const listName = req.body.list; //Gets custom lists name.

    //Creates a new document to insert into DB
    const item = new Item({
        name: itemName
    });

    //Saves new document to default list.
    if(listName === "Today"){

        item.save();
        res.redirect("/");

    }else{
        //Finds custom list and pushes new document to it.
        List.findOne({name:listName}, function(err, foundList){

            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);

        });
    }

});

//Deletes items from DB that are checked off by user.
app.post("/delete",function(req,res){

    const delId = req.body.checkbox; //Gets the id of ticked checkbox.
    const listName = req.body.listName; //Gets the listname of current list.

    
    if(listName === "Today"){
        //Finds element in default list by its ID and deletes it.
        Item.findByIdAndRemove(delId, function(err){
            if(err){
                console.log(err);
            }else{
                res.redirect("/");
            }
        });

    }else{
        //Finds custom list by its listName and pulls out element matched by delID.
        List.findOneAndUpdate({name: listName} , {$pull: {items: {_id: delId}}}, function(err,){
            if(err){
                console.log(err);
            }else{
                res.redirect("/" +  listName);
            }
        });
    }

});

app.listen(3000, function(){
    console.log("Listening at 3000");
})