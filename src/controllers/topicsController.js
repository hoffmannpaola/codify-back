const {
  User, Exercise, Theory, Topic, Chapter, TopicUser, TheoryUser, ExerciseUser,
} = require('../models');
const { NotFoundError, NotNextTopicError } = require('../errors');
const chaptersController = require('./chaptersController');

class TopicsController {
  getAll({
    _end, _start, _order, _sort, id,
  }) {
    let options = {
      limit: _end - _start,
      offset: _start,
      order: [[_sort, _order]],
      where: { excluded: false },
    };

    if (id) options = { where: { excluded: false, id } };

    return Topic.findAndCountAll(options);
  }

  getOne(id) {
    return Topic.findByPk(id);
  }

  async getOneWithUserProgress(topicId, userId) {
    const topic = await Topic.findByPk(topicId, {
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
      },
      order: [[{ model: Exercise }, 'id', 'ASC']],
      include: [
        {
          model: Theory,
          attributes: [['id', 'theoryId'], 'youtubeUrl'],
          include: {
            model: User,
            attributes: [['id', 'userId']],
            through: {
              where: { userId },
              attributes: [],
              required: false,
            },
          },
        },
        {
          model: Exercise,
          attributes: [['id', 'exerciseId'], 'description'],
          include: {
            model: User,
            attributes: [['id', 'userId']],
            through: {
              where: { userId },
              attributes: [],
              required: false,
            },
          },
        },
      ],
    });

    if (!topic) throw new NotFoundError();

    topic.theories.forEach((t) => {
      if (t.dataValues.users.length > 0) t.dataValues.userHasFinished = true;
      else t.dataValues.userHasFinished = false;

      delete t.dataValues.users;
    });

    topic.exercises.forEach((e) => {
      if (e.dataValues.users.length > 0) e.dataValues.userHasFinished = true;
      else e.dataValues.userHasFinished = false;

      delete e.dataValues.users;
    });

    return topic;
  }

  async editTopic({
    id, chapterId, name, order,
  }) {
    const topic = await this.getOne(id);
    if (!topic) throw new NotFoundError('Topic not found');

    if (topic.chapterId !== chapterId) {
      await chaptersController.changeTopicsQuantity(topic.chapterId, 'minus');
      await chaptersController.changeTopicsQuantity(chapterId, 'plus');
    }

    topic.chapterId = chapterId;
    topic.name = name;
    topic.order = order;

    await topic.save();

    return topic;
  }

  async createTopic({ chapterId, name, order }) {
    await chaptersController.changeTopicsQuantity(chapterId, 'plus');

    return Topic.create({
      chapterId, name, order,
    });
  }

  async deleteTopic(id) {
    const topic = await this.getOne(id);

    await chaptersController.changeTopicsQuantity(topic.chapterId, 'minus');

    topic.excluded = true;
    await topic.save();

    return topic;
  }

  async postTopicProgress(userId, topicId) {
    const topic = await Topic.findByPk(topicId, {
      include: Chapter,
    });
    if (!topic) throw new NotFoundError();

    const completedTopic = await this._completedAllActivities(userId, topicId);
    if (completedTopic) {
      await TopicUser.findOrCreate({ where: { userId, topicId } });
    } else {
      const association = await TopicUser.findOne({ where: { userId, topicId } });
      if (association) {
        await association.destroy();
      }
    }

    const nextTopic = await this._getNextTopic(topic);
    if (!nextTopic) {
      throw new NotNextTopicError();
    }

    return { nextTopic };
  }

  async _completedAllActivities(userId, topicId) {
    const quantityExercises = await Exercise.count({ where: { topicId } });
    const quantityTheory = await Theory.count({ where: { topicId } });

    const countTheoryDone = await Theory.count({
      where: { topicId },
      include: {
        model: TheoryUser,
        where: { userId },
      },
    });

    const countExerciseDone = await Exercise.count({
      where: { topicId },
      include: {
        model: ExerciseUser,
        where: { userId },
      },
    });

    if (countTheoryDone !== quantityTheory || countExerciseDone !== quantityExercises) {
      return false;
    }

    return true;
  }

  async _getNextTopic(topic) {
    let nextTopic = await Topic.findOne({
      attributes: ['id'],
      where: {
        chapterId: topic.chapterId,
        order: topic.order + 1,
      },
    });

    if (!nextTopic) {
      nextTopic = await Topic.findOne({
        where: { order: 1 },
        attributes: ['id'],
        include: {
          model: Chapter,
          attributes: [],
          where: {
            courseId: topic.chapter.courseId,
            order: topic.chapter.order + 1,
          },
        },
      });
    }

    return nextTopic.id;
  }
}

module.exports = new TopicsController();
