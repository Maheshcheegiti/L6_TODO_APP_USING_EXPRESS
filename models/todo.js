"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static addTodo({ title, dueDate }) {
      return this.create({
        title,
        dueDate,
        completed: false,
      });
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }

    static showAll() {
      return this.findAll();
    }

    static deleteById(id) {
      return this.destroy({ where: { id } });
    }

    static overDue() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date(),
          },
        },
      });
    }

    static dueToday() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date(),
          },
        },
      });
    }

    static dueLater() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
        },
      });
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    },
  );
  return Todo;
};
