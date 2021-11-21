const express = require('express');

const router = express.Router();

const TweetsController = require('../controllers/tweets');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { paginationMiddleware } = require('../middlewares/paginationMiddleware');

router.post('/', authMiddleware, TweetsController.createTweet);
router.get('/:id', TweetsController.getTweetById);

module.exports = router;
