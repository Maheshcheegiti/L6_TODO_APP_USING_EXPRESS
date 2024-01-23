const express = require("express");
const { request, response } = require("express");
const app = express();
const { Todo } = require("./models");
app.use(express.json());

app.get("/todos", (request, response) => {
  console.log("Todo List");
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

app.delete("/todos/:id", (request, response) => {
  console.log("deleting a todo", request.params.id);
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
