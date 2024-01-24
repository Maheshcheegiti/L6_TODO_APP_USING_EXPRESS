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
const flash = require("connect-flash");

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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(flash());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

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
            return done(null, false, { message: "Invalid password." });
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

app.get("/", async (request, response) => {
  response.render("index", {
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", (request, response) => {
  return response.render("signup", { csrfToken: request.csrfToken() });
});

app.post("/users", async (request, response) => {
  const firstName = request.body.firstName;
  const lastName = request.body.lastName;
  const email = request.body.email;
  const password = request.body.password;

  if (firstName.length < 3) {
    request.flash("error", "First name should be atleast 3 characters long");
  }

  if (lastName.length < 3) {
    request.flash("error", "Last name should be atleast 3 characters long");
  }

  // validate email
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    request.flash("error", "Invalid email");
  }

  if (password.length < 8) {
    request.flash("error", "Password should be atleast 8 characters long");
    return response.redirect("/signup");
  }

  const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    request.login(user, (error) => {
      if (error) {
        request.flash("error", "Error while logging in");
        return response.redirect("/login");
      }
      return response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "Email already exists or Some error occured");
    return response.redirect("/signup");
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
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    response.redirect("/todos");
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
    const title = request.body.title;
    const dueDate = request.body.dueDate;

    if (title.length < 5) {
      request.flash("error", "length of title should be greater than 5");
    }
    if (dueDate.length < 1) {
      request.flash("error", "Due date cannot be empty");
      return response.redirect("/todos");
    }

    try {
      await Todo.addTodo({
        title,
        dueDate,
        completed: false,
        userId: request.user.id,
      });

      return response.redirect("/todos");
    } catch (error) {
      console.log(error);

      request.flash("error", "length of title should be greater than 5");

      return response.redirect("/todos");
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
