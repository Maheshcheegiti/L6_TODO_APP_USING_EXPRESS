/* eslint-disable linebreak-style */
/* eslint-disable quotes */
/* eslint-disable semi */
/* eslint-disable object-curly-spacing */

const request = require("supertest");

const db = require("../models/index");
const app = require("../app");

let server;
let agent;

describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    await server.close();
  });

  test("responds with json at /todos", async () => {
    const response = await agent.post("/todos").send({
      title: "Buy Chocolate",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe(
      "application/json; charset=utf-8",
    );
    const parsedResponse = JSON.parse(response.text);
    expect(parsedResponse.id).toBeDefined();
  });
});
