/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
/* eslint-disable linebreak-style */
/* eslint-disable quotes */

const express = require("express");
const csrf = require("tiny-csrf");
const cookieparser = require("cookie-parser");
const app = express();
const { Todo } = require("./models");
const path = require("path");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser("secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (request, response) => {
  const overDue = await Todo.overDue();
  const dueToday = await Todo.dueToday();
  const dueLater = await Todo.dueLater();
  const completedTasks = await Todo.completedTasks();
  if (request.accepts("html")) {
    return response.render("index", {
      overDue,
      dueToday,
      dueLater,
      completedTasks,
      csrfToken: request.csrfToken(),
    });
  } else {
    return response.json({ overDue, dueToday, dueLater, completedTasks });
  }
});

app.get("/todos", async (request, response) => {
  try {
    const todos = await Todo.showAll();
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(500).json(error);
  }
});

app.post("/todos", async (request, response) => {
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false,
    });

    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(500).json(error);
  }
});

app.put("/todos/:id", async (request, response) => {
  const todo = await Todo.findByPk(request.params.id);
  const completed = request.body.completed;
  try {
    const updatedTodo = await todo.setCompletionStatus(completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(500).json(error);
  }
});

app.delete("/todos/:id", async (request, response) => {
  try {
    const todo = await Todo.deleteById(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(500).json(error);
  }
});

module.exports = app;
