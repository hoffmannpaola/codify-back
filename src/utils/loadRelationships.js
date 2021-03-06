const User = require('../models/User');
const Session = require('../models/Session');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Theory = require('../models/Theory');
const Exercise = require('../models/Exercise');
const CourseUser = require('../models/CourseUser');
const TopicUser = require('../models/TopicUser');
const TheoryUser = require('../models/TheoryUser');
const ExerciseUser = require('../models/ExerciseUser');

User.hasOne(Session);
User.belongsToMany(Course, { through: CourseUser });
User.belongsToMany(Topic, { through: TopicUser });
User.belongsToMany(Theory, { through: TheoryUser });
User.belongsToMany(Exercise, { through: ExerciseUser });

Course.belongsToMany(User, { through: CourseUser });
Course.hasMany(Chapter);

Chapter.hasMany(Topic);

Topic.belongsToMany(User, { through: TopicUser });
Topic.hasMany(Theory);
Topic.hasMany(Exercise);
Topic.hasMany(TopicUser);
Topic.belongsTo(Chapter);

Theory.belongsToMany(User, { through: TheoryUser });
Theory.hasMany(TheoryUser);
Exercise.belongsToMany(User, { through: ExerciseUser });
Exercise.hasMany(ExerciseUser);
