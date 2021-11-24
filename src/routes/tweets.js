const express = require('express');

const router = express.Router();

const TweetsController = require('../controllers/tweets');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { paginationMiddleware } = require('../middlewares/paginationMiddleware');

router.post('/', authMiddleware, TweetsController.createTweet);
router.get('/:id', TweetsController.getTweetById);

router.delete('/:id', authMiddleware, TweetsController.deleteTweetById);
router.get('/', authMiddleware, paginationMiddleware, TweetsController.myTweetsFeed);
router.get('/feed/:username', paginationMiddleware, TweetsController.myTweetsFeedByUserName);
router.post('/:id/likes', authMiddleware, TweetsController.likeTweet);
router.post('/:id/comments', authMiddleware, paginationMiddleware, TweetsController.createNewComment);

module.exports = router;
