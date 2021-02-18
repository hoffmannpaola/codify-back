const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

async function createCoursesUtils(db, title, description, color, imageUrl) {
  const course = await db.query('INSERT INTO courses (title, description, color, "imageUrl") values ($1, $2, $3, $4) RETURNING *;', [
    title,
    description,
    color,
    imageUrl,
  ]);

  return course.rows[0].id;
}

async function createUserUtils(db, name, password, email, avatarUrl) {
  const user = await db.query('INSERT INTO users (name, password, email, "avatarUrl") values ($1, $2, $3, $4) RETURNING *;', [
    name,
    password,
    email,
    avatarUrl,
  ]);

  return user.rows[0];
}

async function createCourseUsersUtils(db, userId) {
  const course = await createCoursesUtils(db, 'Ruby iniciante', 'Pra arrasar com Ruby', 'fff', 'https://i.imgur.com/KOloELl.jpeg');

  const courseUsers = await db.query('INSERT INTO into "courseUsers"("userId", "courseId", "doneActivities", "createdAt", "updatedAt") values($1, $2, $3, $4, $5) RETURNING *;', [
    userId,
    course.id,
    0,
    Sequelize.DATA,
    Sequelize.DATA,
  ]);

  return courseUsers.rows[0];
}

async function cleanDataBase(db) {
  await db.query('DELETE FROM "theoryUsers"');
  await db.query('DELETE FROM "topicUsers"');
  await db.query('DELETE FROM "exerciseUsers"');
  await db.query('DELETE FROM theories');
  await db.query('DELETE FROM exercises');
  await db.query('DELETE FROM topics');
  await db.query('DELETE FROM chapters');
  await db.query('DELETE FROM "courseUsers"');
  await db.query('DELETE FROM "adminSessions"');
  await db.query('DELETE FROM sessions');
  await db.query('DELETE FROM courses');
  await db.query('DELETE FROM users');
  await db.query('ALTER SEQUENCE courses_id_seq RESTART WITH 1;');
}

async function createAdminSession(db) {
  const sessionAdmin = await db.query(`
  INSERT INTO "adminSessions"
  ("userId", "createdAt", "updatedAt")
  VALUES (1,'2019-01-23T09:23:42.079Z','2019-01-23T09:23:42.079Z')
  RETURNING *`);

  return jwt.sign({ id: sessionAdmin.rows[0].id }, process.env.SECRET);
}

async function createUserSession(db) {
  const password = bcrypt.hashSync('123456', 10);

  const user = await db.query(
    `INSERT INTO users 
    (name, password, email, "avatarUrl", "createdAt", "updatedAt") VALUES ($1 , $2, $3, $4, $5, $6) 
    RETURNING *`,
    ['Teste de Teste', password, 'teste@teste.com', 'https://google.com', new Date(), new Date()],
  );
  const sessionUser = await db.query(
    `INSERT INTO sessions 
    ("userId", "createdAt", "updatedAt")
    VALUES ($1 , $2, $3) RETURNING *`,
    [user.rows[0].id, new Date(), new Date()],
  );
  const userToken = jwt.sign({ id: sessionUser.rows[0].id }, process.env.SECRET);
  const userId = user.rows[0].id;

  return { userToken, userId };
}
module.exports = {
  createCoursesUtils,
  createUserUtils,
  createCourseUsersUtils,
  cleanDataBase,
  createAdminSession,
  createUserSession,
};
