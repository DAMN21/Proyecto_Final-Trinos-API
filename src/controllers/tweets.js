const ApiError = require('../utils/ApiError');
const { Tweet, User, Comment } = require('../database/models');
const TweetSerializer = require('../serializers/TweetSerializer');
const TweetsSerializer = require('../serializers/TweetsSerializer');
const CommentsSerializer = require('../serializers/CommentsSerializer');

const findUser = async (where) => {
  Object.assign(where, { active: true });

  const user = await User.findOne({ where });
  if (!user) {
    throw new ApiError('User not found', 400);
  }
  return user;
};

const findTweet = async (where) => {
  Object.assign(where);

  const tweet = await Tweet.findOne({ where });
  if (!tweet) {
    throw new ApiError('Tweet not found', 404);
  }
  return tweet;
};

const findComment = async (where) => {
  Object.assign(where, { active: true });

  const user = await Comment.findOne({ where });
  if (!user) {
    throw new ApiError('User not found', 400);
  }

  return user;
};

const createTweet = async (req, res, next) => {
  try {
    const { body } = req;

    if (body.text === '') {
      throw new ApiError('Bad request', 400);
    }
    const tweet = await Tweet.create({
      text: body.text,
      likeCounter: 0,
    });
    const user = await findUser(req.user.id);
    const tweetCopy = tweet.dataValues;
    tweetCopy.user = user.dataValues;
    tweetCopy.comments = [];

    res.json({
      status: 'success',
      data: {
        ...tweetCopy,
      },
      paginationInfo: null,
    });
  } catch (err) {
    next(err);
  }
};

const getTweetById = async (req, res, next) => {
  try {
    const { params } = req;
    const id = Number(params.id);
    const tweet = await Tweet.findOne({ where: id });
    if (!tweet) {
      res.json({ status: 'error', data: null });
    } else {
      res.json({ status: 'success', data: null });
    }
  } catch (err) {
    next(err);
  }
};

const deleteTweetById = async (req, res, next) => {
  try {
    const { params } = req;

    const tweetId = Number(params.id);
    const tweet = await Tweet.findOne({ where: tweetId });

    if (tweet && (req.user.id === tweet.userId)) {
      await tweet.destroy({ where: { id: tweetId } });
      res.json({ status: 'success', data: null });
    } else {
      res.json({ status: 'error', data: null });
    }
  } catch (err) {
    next(err);
  }
};

const myTweetsFeed = async (req, res, next) => {
  const where = {
    userId: req.user.id,
  };

  const myTweets = await Tweet.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: { exclude: ['password', 'active', 'role'] } },
      { model: Comment, as: 'comments' }],
    ...req.pagination,
    attributes: { exclude: ['userId'] },
  });

  // res.json(myTweets);
  res.json(new TweetsSerializer(myTweets, await req.getPaginationInfo(Tweet)));
};
const myTweetsFeedByUserName = async (req, res, next) => {
  try {
    const { params } = req;
    const user = await findUser({ username: params.username });
    const where = {
      userId: user.id,
    };
    console.log(user);
    const myTweets = await Tweet.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: { exclude: ['password', 'active', 'role'] } },
        { model: Comment, as: 'comments' }],
      ...req.pagination,
      attributes: { exclude: ['userId'] },
    });

    // res.json(myTweets);
    res.json(new TweetsSerializer(myTweets, await req.getPaginationInfo(Tweet)));
  } catch (err) {
    next(err);
  }
};

const likeTweet = async (req, res, next) => {
  try {
    const { params } = req;
    const Idtweet = Number(params.id);
    const tweet2 = await Tweet.findOne({ where: Idtweet });
    tweet2.likeCounter += 1;
    await tweet2.save();
    const tweet = await Tweet.findOne({
      where: Idtweet,
      include: [{ model: User, as: 'user', attributes: { exclude: ['password', 'active', 'role'] } },
        { model: Comment, as: 'comments' }],
      attributes: { exclude: ['userId'] },
    });
    // tweet.likeCounter += 1
    res.json(new TweetSerializer(tweet));
  } catch (err) {
    next(err);
  }
};

const createNewComment = async (req, res, next) => {
  try {
    const { body } = req;

    console.log(req);
    const comment = await Comment.create({
      text: body.text,
      likeCounter: 0,
      tweetId: Number(req.params.id),
    });
    comment.tweetId = req.params.id;
    res.json(new CommentsSerializer(comment, await req.getPaginationInfo(Comment)));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTweet,
  getTweetById,
  deleteTweetById,
  myTweetsFeed,
  likeTweet,
  myTweetsFeedByUserName,
  createNewComment,
};
