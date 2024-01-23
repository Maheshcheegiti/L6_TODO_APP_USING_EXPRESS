/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
/* eslint-disable linebreak-style */
/* eslint-disable quotes */

const express = require("express");
const app = express();
const { Todo } = require("./models");
app.use(express.json());

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
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false,
    });

    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(500).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async (request, response) => {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
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
