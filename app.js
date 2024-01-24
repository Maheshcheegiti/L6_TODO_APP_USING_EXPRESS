/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
/* eslint-disable linebreak-style */
/* eslint-disable quotes */

const express = require("express");
const csrf = require("tiny-csrf");
const cookieparser = require("cookie-parser");
const app = express();
const { Todo, User } = require("./models");
const path = require("path");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const saltRounds = 10;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser("secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(
  session({
    secret: "my-super-secret-key-21728172615261562",
    cookie: { maxAge: 3600000 },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        await User.findOne({ where: { email } }).then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (!result) {
            return done("Invalid password");
          }
          return done(null, user);
        });
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    await User.findByPk(id).then((user) => {
      done(null, user);
    });
  } catch (error) {
    done(error);
  }
});

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (request, response) => {
  response.render("index", {
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", (request, response) => {
  return response.render("signup", { csrfToken: request.csrfToken() });
});

app.post("/users", async (request, response) => {
  const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);

  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPassword,
    });

    request.login(user, (error) => {
      if (error) {
        return response.status(500).json(error);
      }
      return response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json(error);
  }
});

app.get("/login", (request, response) => {
  return response.render("login", { csrfToken: request.csrfToken() });
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    return response.redirect("/");
  });
});

app.post(
  "/session",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (request, response) => {
    return response.redirect("/todos");
  },
);

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const userId = request.user.id;
    const overDue = await Todo.overDue(userId);
    const dueToday = await Todo.dueToday(userId);
    const dueLater = await Todo.dueLater(userId);
    const completedTasks = await Todo.completedTasks(userId);
    if (request.accepts("html")) {
      return response.render("todos", {
        overDue,
        dueToday,
        dueLater,
        completedTasks,
        csrfToken: request.csrfToken(),
      });
    } else {
      return response.json({ overDue, dueToday, dueLater, completedTasks });
    }
  },
);

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        completed: false,
        userId: request.user.id,
      });

      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  },
);

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const todo = await Todo.findByPk(request.params.id);
    const completed = request.body.completed;
    try {
      const updatedTodo = await todo.setCompletionStatus(completed);
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  },
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const userId = request.user.id;
      const todo = await Todo.deleteById(request.params.id, userId);
      return response.json(todo);
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  },
);

module.exports = app;
