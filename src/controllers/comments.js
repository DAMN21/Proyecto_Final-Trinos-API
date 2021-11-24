const ApiError = require('../utils/ApiError');
const { User, Tweet, Comment } = require('../database/models');
const CommentSerializer = require('../serializers/CommentSerializer');

const findCommentsByTweetId = async (where) => {
  const idComent = await Comment.findOne({ where });
  if (!idComent) {
    throw new ApiError('error', 404);
  }
  return idComent;
};
const deleteCommentById = async (req, res, next) => {
  try {
    const { params } = req;

    const tweetId = Number(params.id);
    const comment = await findCommentsByTweetId({ id: tweetId });
    if (!comment) {
      throw new ApiError('Comments not found', 404);
    } else {
      comment.destroy({ where: { id: tweetId } });
      res.json(new CommentSerializer(null));
    }
  } catch (err) {
    next(err);
  }
};

const likeComments = async (req, res, next) => {
  try {
    const { params } = req;
    const commentId = Number(params.id);
    const comment = await Comment.findOne({ where: commentId });
    comment.likeCounter += 1;
    await comment.save();

    res.json(new CommentSerializer(comment));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  deleteCommentById,
  likeComments,
};
