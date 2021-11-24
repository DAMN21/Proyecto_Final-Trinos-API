const express = require('express');

const router = express.Router();

const CommentsController = require('../controllers/comments');
const { authMiddleware } = require('../middlewares/authMiddleware');
// const { paginationMiddleware } = require('../middlewares/paginationMiddleware');

router.delete('/:id', authMiddleware, CommentsController.deleteCommentById);

router.post('/:id/likes', authMiddleware, CommentsController.likeComments);

module.exports = router;
