const request = require('supertest');

const app = require('../app');

const { ROLES } = require('../src/config/constants');
const { generateAccessToken } = require('../src/services/jwt');

const database = require('../src/database');
const { User, Tweets } = require('../src/database/models');

const COMMENTS_PATH = '/comments';

const FIRST_USER = {
  username: 'user1',
  name: 'User 1',
  email: 'user1@test.com',
  password: '12345',
  passwordConfirmation: '12345',
};

const NEW_USER = {
  username: 'myusername',
  name: 'Tester user',
  email: 'tester@test.com',
  password: '1234',
  passwordConfirmation: '1234',
};

describe('Comments routes', () => {
  let firstUserAccessToken;
  let secondUserAccessToken;
  let firstUser;
  let secondUser;

  beforeAll(async () => {
    await database.init();

    firstUser = await User.create(FIRST_USER);
    firstUserAccessToken = generateAccessToken(firstUser.id, firstUser.role);

    secondUser = await User.create(Object.assign(FIRST_USER, { active: false }));
    secondUserAccessToken = generateAccessToken(secondUser.id, secondUser.role);

    const payload = {
      text: 'My tweet 1',
    };
    const payloadcomment = {
      text: 'My comment 1',
    };
    const responsetweet = await request(app).post('/tweets').send(payload).set('Authorization', `bearer ${firstUserAccessToken}`);

    const response = await request(app).post('/tweets/1/comments').send(payloadcomment).set('Authorization', `bearer ${firstUserAccessToken}`);
  });

  it('Should return Access token required on like comment', async () => {
    const response = await request(app).post(`${COMMENTS_PATH}/1/likes`);

    expect(response.statusCode).toBe(401);
    expect(response.body.status).toBe('Access token required');

    expect(response.body.data).toBeNull();
  });

  it('Should return Comments not found on like comment', async () => {
    const response = await request(app).post(`${COMMENTS_PATH}/2/likes`).set('Authorization', `bearer ${firstUserAccessToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.status).toBe('Comments not found');

    expect(response.body.data).toBeNull();
  });

  it('Should return Comment after like Comment', async () => {
    const payload = {
      text: 'My comment 1',
    };
    const response = await request(app).post(`${COMMENTS_PATH}/1/likes`).set('Authorization', `bearer ${secondUserAccessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.data.id).toBe(1);
    expect(response.body.data.text).toBe(payload.text);
    expect(response.body.data.likeCounter).not.toBe(0);
    expect(response.body.data.tweetId).toBe(1);

    expect(response.body.data.createdAt).not.toBeNull();
    expect(response.body.data.updatedAt).not.toBeNull();

    expect(response.body.paginationInfo).toBeNull();
  });

  it('Should return Comments not found error on comment delete', async () => {
    const response = await request(app).delete(`${COMMENTS_PATH}/2`).set('Authorization', `bearer ${firstUserAccessToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.status).toBe('error');

    expect(response.body.data).toBeNull();
  });

  it('Should return Access token required error on comment delete', async () => {
    const response = await request(app).delete(`${COMMENTS_PATH}/2`);

    expect(response.statusCode).toBe(401);
    expect(response.body.status).toBe('Access token required');

    expect(response.body.data).toBeNull();
  });

  it('Should delete Comment', async () => {
    const payload = {
      text: 'My comment 1',
    };
    const response = await request(app).delete(`${COMMENTS_PATH}/1`).set('Authorization', `bearer ${secondUserAccessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.data).toBeNull();

    expect(response.body.paginationInfo).toBeNull();
  });
});
