const request = require('supertest');

const app = require('../app');
const { ROLES } = require('../src/config/constants');
const { generateAccessToken } = require('../src/services/jwt');

const database = require('../src/database');

const { User, Tweets } = require('../src/database/models');

const TWEETS_PATH = '/tweets';

const FIRST_USER = {
  username: 'user1',
  name: 'User 1',
  email: 'user1@test.com',
  password: '12345',
};

const NEW_USER = {
  id: 1,
  username: 'myusername',
  name: 'Tester user',
  email: 'tester@test.com',
};

describe('Tweets routes', () => {
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
  });

  it('Should create tweet', async () => {
    const payload = {
      text: 'My first tweet',
    };
    const response = await request(app).post(TWEETS_PATH).send(payload).set('Authorization', `bearer ${firstUserAccessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.text).toBe(payload.text);
    expect(response.body.data.likeCounter).toBe(0);
    expect(response.body.data.idUser).toBe(firstUser.id);
    expect(response.body.data.id).toBe(firstUser.id);
    expect(response.body.data.name).toBe(firstUser.name);
    expect(response.body.data.username).toBe(firstUser.username);
    expect(response.body.data.email).toBe(firstUser.email);
    expect(response.body.data.createdAt).not.toBeNull();
    expect(response.body.data.updatedAt).not.toBeNull();
    expect(response.body.data.lastLoginDate).not.toBeNull();
  });

  it('Should return bad request on create tweet with invalid payload', async () => {
    const payload = {
      text: 'My first tweet',
    };
    const response = await request(app).post(TWEETS_PATH).send(payload)
      .set('Authorization', `bearer ${firstUserAccessToken}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('User not found');
  });
});
