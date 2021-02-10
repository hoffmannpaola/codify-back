/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Session = require('../models/Session');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const CourseUser = require('../models/CourseUser');
const NotFoundError = require('../errors/NotFoundError');
const WrongPasswordError = require('../errors/WrongPasswordError');
const AuthError = require('../errors/AuthError');
const AdminSession = require('../models/AdminSession');

class UsersController {
  async create({
    name, password, email, avatarUrl,
  }) {
    avatarUrl = !avatarUrl ? null : avatarUrl;
    password = bcrypt.hashSync(password, 10);
    const user = await User.create({
      name, email, password, avatarUrl,
    }, { returning: true, raw: true });
    delete user.dataValues.password;
    return user;
  }

  findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  async createSession(email, password) {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundError('User not found');

    const passwordComparison = bcrypt.compareSync(password, user.password);
    if (!passwordComparison) {
      throw new WrongPasswordError('Password is incorrect');
    }

    const session = await Session.create({ userId: user.id });
    const token = jwt.sign({ id: session.id }, process.env.SECRET);

    return {
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      token,
    };
  }

  findSessionById(id) {
    const session = Session.findByPk(id);
    if (!session) throw new NotFoundError();
    return session;
  }

  async getCourseProgress(userId, courseId) {
    let userProgress;

    const user = await User.findByPk(userId);
    const course = await Course.findByPk(courseId);
    if (!user) throw new NotFoundError('User not found');
    if (!course) throw new NotFoundError('Course not found');

    const userCourseData = await CourseUser.findOne({ where: { userId, courseId } });
    if (!userCourseData) userProgress = '0%';
    else {
      const totalTopics = await Chapter.sum('topicsQuantity', { where: { courseId } });

      userProgress = Math.floor((userCourseData.doneActivities / totalTopics) * 100);
      userProgress = `${userProgress}%`;
    }

    return {
      userId,
      courseId,
      progress: userProgress,
    };
  }

  async postAdminSignIn(username, password) {
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      throw new AuthError('Wrong username or password');
    }

    const session = await AdminSession.create({ userId: process.env.ADMIN_ID });
    const token = jwt.sign({ id: session.id }, process.env.SECRET);
    return token;
  }

  async postAdminSignOut(id) {
    return AdminSession.destroy({ where: { id } });
  }

  findAdminSessionById(id) {
    return AdminSession.findByPk(id);
  }
}

module.exports = new UsersController();
