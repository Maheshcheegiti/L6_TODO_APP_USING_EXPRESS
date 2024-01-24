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

const login = async (agent, email, password) => {
  let res = await agent.get("/login");
  const crsfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email,
    password,
    _csrf: crsfToken,
  });
};

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

  test("Sign Up", async () => {
    const res = await agent.get("/signup");
    const crsfToken = extractCsrfToken(res);
    const response = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@test.com",
      password: "12345678",
      _csrf: crsfToken,
    });
    expect(response.status).toBe(302);
  });

  test("Signout", async () => {
    let res = await agent.get("/todos");
    expect(res.status).toBe(200);
    res = await agent.get("/signout");
    expect(res.status).toBe(302);
    res = await agent.get("/todos");
    expect(res.status).toBe(302);
  });

  test("creating a new todo", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    const res = await agent.get("/todos");
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
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let crsfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: crsfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");

    const parsedGruopedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGruopedResponse.dueToday.length;
    const latestTodo = parsedGruopedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    crsfToken = extractCsrfToken(res);
    const markAsCompletedResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: crsfToken,
        completed: true,
      });

    const parsedMarkAsCompletedResponse = JSON.parse(
      markAsCompletedResponse.text,
    );

    expect(parsedMarkAsCompletedResponse.completed).toBe(true);
  });

  test("Marks as incompleted", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let crsfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: crsfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");

    const parsedGruopedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGruopedResponse.dueToday.length;
    const latestTodo = parsedGruopedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    crsfToken = extractCsrfToken(res);
    const markAsCompletedResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: crsfToken,
        completed: false,
      });

    const parsedMarkAsCompletedResponse = JSON.parse(
      markAsCompletedResponse.text,
    );

    expect(parsedMarkAsCompletedResponse.completed).toBe(false);
  });

  test("Delete a todo", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let crsfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: crsfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");

    const parsedGruopedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGruopedResponse.dueToday.length;
    const latestTodo = parsedGruopedResponse.dueToday[dueTodayCount - 1];
    const latestTodoId = latestTodo.id;

    res = await agent.get("/todos");
    crsfToken = extractCsrfToken(res);
    const deleteResponse = await agent.delete(`/todos/${latestTodoId}`).send({
      _csrf: crsfToken,
    });

    const parsedDeleteResponse = JSON.parse(deleteResponse.text);
    expect(parsedDeleteResponse).toEqual(1);
    expect(deleteResponse.status).toBe(200);
  });

  test("Get all todos", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let crsfToken = extractCsrfToken(res);
    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");

    const parsedGruopedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGruopedResponse.dueToday.length;

    await agent.post("/todos").send({
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: crsfToken,
    });

    res = await agent.get("/todos");
    crsfToken = extractCsrfToken(res);

    const groupedTodosResponse2 = await agent
      .get("/todos")
      .set("Accept", "application/json");

    const parsedGruopedResponse2 = JSON.parse(groupedTodosResponse2.text);
    const dueTodayCount2 = parsedGruopedResponse2.dueToday.length;

    expect(dueTodayCount2).toBe(dueTodayCount + 1);
  });
});
