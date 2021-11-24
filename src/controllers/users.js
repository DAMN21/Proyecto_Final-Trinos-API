// const { v4: uuid } = require('uuid');
const ApiError = require('../utils/ApiError');
const { User } = require('../database/models');
const { generateAccessToken } = require('../services/jwt');

const UserSerializer = require('../serializers/UserSerializer');
const AuthSerializer = require('../serializers/AuthSerializer');
const UsersSerializer = require('../serializers/UsersSerializer');
// const { transporter } = require('../config/mailer');

const { ROLES } = require('../config/constants');

const findUser = async (where) => {
  Object.assign(where, { active: true });

  const user = await User.findOne({ where });
  if (!user) {
    throw new ApiError('User not found', 400);
  }

  return user;
};

const getAllUsers = async (req, res, next) => {
  try {
    req.isRole(ROLES.admin);

    const users = await User.findAll({ ...req.pagination });

    res.json(new UsersSerializer(users, await req.getPaginationInfo(User)));
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { body } = req;

    if (body.password !== body.passwordConfirmation) {
      throw new ApiError('Passwords do not match', 400);
    }

    const userPayload = {
      username: body.username,
      email: body.email,
      name: body.name,
      password: body.password,
    };

    if (Object.values(userPayload).some((val) => val === undefined)) {
      throw new ApiError('Payload must contain name, username, email and password', 400);
    }

    const user = await User.create(userPayload);

    res.json(new UserSerializer(user));
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { params } = req;

    const user = await findUser({ id: Number(params.id) });

    res.json(new UserSerializer(user));
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { params, body } = req;

    const userId = Number(params.id);
    req.isUserAuthorized(userId);

    const user = await findUser({ id: userId });

    const userPayload = {
      username: body.username,
      email: body.email,
      name: body.name,
    };

    if (Object.values(userPayload).some((val) => val === undefined)) {
      throw new ApiError('Payload can only contain username, email or name', 400);
    }

    Object.assign(user, userPayload);

    await user.save();

    res.json(new UserSerializer(user));
  } catch (err) {
    next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { body } = req;

    if (body.password === undefined || body.passwordConfirmation === undefined) {
      throw new ApiError('User not found', 400);
    }

    if (body.password !== body.passwordConfirmation) {
      throw new ApiError('Passwords do not match', 400);
    }

    const userId = Number(req.user.id);
    req.isUserAuthorized(userId);

    const user = await findUser({ id: userId });

    Object.assign(user, body.password);

    await user.save();

    res.json(new UserSerializer(user));
  } catch (err) {
    next(err);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const { params } = req;

    const userId = Number(params.id);
    req.isUserAuthorized(userId);

    const user = await findUser({ id: userId });

    Object.assign(user, { active: false });

    await user.save();

    res.json(new UserSerializer(null));
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { body } = req;

    const user = await findUser({ username: body.username });

    if (!(await user.comparePassword(body.password))) {
      throw new ApiError('User not found', 400);
    }

    const userPayload = {
      lastLoginDate: new Date(),
    };

    Object.assign(user, userPayload);

    await user.save();

    const accessToken = generateAccessToken(user.id, user.role);

    res.json(new AuthSerializer(accessToken));
  } catch (err) {
    next(err);
  }
};

/* const sendEmailPassword = async (req, res, next) => {
  try {
    const { body } = req;
    if (body.username === undefined) {
      throw new ApiError('Bad request', 400);
    }
    const user = await findUser({ username: body.username });
    const emailUser = user.dataValues.email;
    console.log(emailUser);

    const Payload = {
      token: uuid(),
    };

    Object.assign(user, Payload);

    await user.save();

    const info = await transporter.sendMail({
      from: '"Forgot password 👻" <dmeza2021@gmail.com>', // sender address
      to: emailUser, // list of receivers
      subject: 'Forgot password ✔', // Subject line
      html: `<b>Hi,</b>
        <p>Please click on the following link,
        or paste this into your browser to complete process </p>
        <br>${Payload.token}</br>
        <p>Atentamente, <br>
        Trinos-API</p>`, // html body
    });
    console.log(info);
    res.json(new UserSerializer(null));
  } catch (err) {
    next(err);
  }
}; */

module.exports = {
  createUser,
  getUserById,
  updateUser,
  updatePassword,
  deactivateUser,
  loginUser,
  getAllUsers,
  // sendEmailPassword,
};
