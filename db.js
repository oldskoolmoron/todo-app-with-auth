const mongoose = require("mongoose");
const { stringify } = require("querystring");

const Schema = mongoose.Schema;
const ObjId = Schema.ObjectId;

const User = new Schema({
  name: String,
  email: String,
  password: String,

});

const ToDo = new Schema({
  userId: ObjId,
  title: String,
  done: Boolean
});

const UserModel = mongoose.model('users', User);
const TodoModel = mongoose.model("todos", ToDo);

module.exports = {
  UserModel,
  TodoModel
}