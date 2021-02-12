const router = require('express').Router();
const coursesController = require('../controllers/coursesController');
const usersController = require('../controllers/usersController');

router.get('/', async (req, res) => {
  try {
    res.status(200).send(await coursesController.getAll());
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get('/suggestions', async (req, res) => {
  const limit = 6;
  res.status(200).send(await coursesController.getSuggestions(limit));
});

router.post('/:courseId/users/:userId', async (req, res) => {
  const { courseId, userId } = req.params;
  await coursesController.initCouserByUserId(+courseId, +userId);
  res.sendStatus(200);
});

router.get('/:courseId/chapters', async (req, res) => {
  const { courseId } = req.params;

  const { userId } = await usersController.findSessionById(req.sessionId);

  const topics = await coursesController
    .getAllTopicsAtChapterFromUser(+courseId, userId);
  res.send(topics);
});

module.exports = router;
