const ApiError = require('../utils/ApiError');
const { Tweet } = require('../database/models');
const TweetSerializer = require('../serializers/TweetSerializer');

const findTweet = async (where) => {
  Object.assign(where, { active: true });

  const user = await Tweet.findOne({ where });
  if (!user) {
    throw new ApiError('User not found', 400);
  }

  return user;
};

const createTweet = async (req, res, next) => {
  try {
    const { body } = req;

    if (Object.values(body.text).some((val) => val === undefined)) {
      throw new ApiError('User not found', 400);
    }

    const tweet = await Tweet.create({
      text: body.text,
      likeCounter: body.likeCounter,
      idUser: body.idUser,
    });
    res.json(new TweetSerializer(tweet));
  } catch (err) {
    next(err);
  }
};

const getTweetById = async (req, res, next) => {
  try {
    const { params } = req;

    const tweet = await findTweet({ id: Number(params.id) });

    res.json(new TweetSerializer(tweet));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTweet,
  getTweetById,

};
