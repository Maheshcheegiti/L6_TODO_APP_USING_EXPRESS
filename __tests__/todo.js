/* eslint-disable linebreak-style */
/* eslint-disable quotes */
/* eslint-disable semi */
/* eslint-disable object-curly-spacing */

const request = require("supertest");
const cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server;
let agent;

function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    await server.close();
  });

  test("responds with json at /todos", async () => {
    const res = await agent.get("/");
    const crsfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy Chocolate",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: crsfToken,
    });
    expect(response.status).toBe(302);
  });

  test("Mark a todo as completed", async () => {
    let res = await agent.get("/");
    let crsfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: crsfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");

    const parsedGruopedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGruopedResponse.dueToday.length;
    const latestTodo = parsedGruopedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    crsfToken = extractCsrfToken(res);
    const markAsCompletedResponse = await agent
      .put(`/todos/${latestTodo.id}/markAsCompleted`)
      .send({
        _csrf: crsfToken,
      });

    const parsedMarkAsCompletedResponse = JSON.parse(
      markAsCompletedResponse.text,
    );

    expect(parsedMarkAsCompletedResponse.completed).toBe(true);
  });

  // test("Delete a todo", async () => {
  //   const response = await agent.post("/todos").send({
  //     title: "Buy Veggie",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });

  //   const parsedResponse = JSON.parse(response.text);
  //   const todoId = parsedResponse.id;
  //   const deleteResponse = await agent.delete(`/todos/${todoId}`);
  //   expect(deleteResponse.status).toBe(200);
  //   const parsedDeleteResponse = JSON.parse(deleteResponse.text);
  //   expect(parsedDeleteResponse).toBe(1);
  // });

  test("Get all todos", async () => {
    const res = await agent.get("/");
    const crsfToken = extractCsrfToken(res);
    const prev = await agent.get("/todos");
    const prevTodos = JSON.parse(prev.text);
    const prevTodosLength = prevTodos.length;

    await agent.post("/todos").send({
      title: "Buy Chocolate",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: crsfToken,
    });

    const response = await agent.get("/todos");
    expect(response.status).toBe(200);
    const todos = JSON.parse(response.text);
    expect(todos.length).toBe(prevTodosLength + 1);
  });
});
