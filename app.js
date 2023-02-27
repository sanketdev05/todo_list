
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");
//mongodb://127.0.0.1:27017/

// Defining Schema
const { Schema } = mongoose;

const itemsSchema = new Schema({
  name: String
});

// creating Model
const Item = mongoose.model("Item", itemsSchema);

const items1 = new Item({
  name: "Welcome to TO DO List"
});

const items2 = new Item({
  name: "Hit + button to create new item"
});

const items3 = new Item({
  name: "<-- Hit here to delete item -->"
});

const defaultItems = [items1, items2, items3];

const listSchema = new Schema({
  name: String,
  items: [itemsSchema]
});

// creating Model
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  
  // Reading through database
  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      //  Insertin items into database
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("yayow!, Succesfully added items to Database. ");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems}); // variable day is replaced with Today  
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
        name: customListName,
        items: defaultItems
      });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {

  const checkedItemid = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemid, function (err) {
      if (!err) {
        console.log("Item deleted succesfully.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemid } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

