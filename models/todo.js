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
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({
        title,
        dueDate,
        completed: false,
        userId,
      });
    }

    setCompletionStatus(status) {
      return this.update({ completed: status });
    }

    static showAll() {
      return this.findAll();
    }

    static async deleteById(id, userId) {
      return this.destroy({ where: { id, userId } });
    }

    static overDue(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date(),
          },
          completed: false,
          userId,
        },
      });
    }

    static dueToday(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date(),
          },
          completed: false,
          userId,
        },
      });
    }

    static dueLater(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
          completed: false,
          userId,
        },
      });
    }

    static completedTasks(userId) {
      return this.findAll({
        where: {
          completed: true,
          userId,
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
