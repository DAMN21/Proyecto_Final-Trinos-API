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
    expect(response.body.data.idUser).toBe(firstUser.idUser);
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

  it('Should my tweet feed', async () => {
    const payload = {
      text: 'My tweet 1',
    };
    const response = await request(app).get(TWEETS_PATH).set('Authorization', `bearer ${firstUserAccessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.data[0].id).not.toBeNull();
    expect(response.body.data[0].text).toBe(payload.text);
    expect(response.body.data[0].likeCounter).not.toBeNull();
    expect(response.body.data[0].userId).toBe(firstUser.id);
    expect(response.body.data[0].createdAt).not.toBeNull();
    expect(response.body.data[0].updatedAt).not.toBeNull();
    expect(response.body.data[0].comments).not.toBeNull();

    expect(response.body.paginationInfo.totalItems).toBe(2);
    expect(response.body.paginationInfo.totalPages).toBe(1);
    expect(response.body.paginationInfo.currentPage).toBe(1);
  });

  it('Should return tweet not found when trying to get a non-existent id', async () => {
    const response = await request(app).get(`${TWEETS_PATH}/3`);

    expect(response.statusCode).toBe(404);
    expect(response.body.status).toBe('Tweet not found');

    expect(response.body.data).toBeNull();
  });

  it('Should return tweet from the consulted id', async () => {
    const payload = {
      text: 'My tweet 1',
    };
    const response = await request(app).get(`${TWEETS_PATH}/1`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.data.tweetId).not.toBeNull();
    expect(response.body.data.text).toBe(payload.text);
    expect(response.body.data.likeCounter).not.toBeNull();
    expect(response.body.data.userId).toBe(firstUser.id);
    expect(response.body.data.createdAt).not.toBeNull();
    expect(response.body.data.updatedAt).not.toBeNull();
    expect(response.body.data.comments).not.toBeNull();

    expect(response.body.paginationInfo).toBeNull();
  });

  it('Should return Access token required on delete tweet', async () => {
    const response = await request(app).delete(`${TWEETS_PATH}/2`);

    expect(response.statusCode).toBe(401);
    expect(response.body.status).toBe('Access token required');

    expect(response.body.data).toBeNull();
  });

  it('Should return tweet not found on delete', async () => {
    const response = await request(app).delete(`${TWEETS_PATH}/3`).set('Authorization', `bearer ${firstUserAccessToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.status).toBe('Tweet not found');

    expect(response.body.data).toBeNull();
  });

  it('Should delete tweet', async () => {
    const response = await request(app).delete(`${TWEETS_PATH}/2`).set('Authorization', `bearer ${firstUserAccessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.data).toBeNull();
  });

  it('Should return Access token required on like tweet', async () => {
    const response = await request(app).post(`${TWEETS_PATH}/1/likes`);

    expect(response.statusCode).toBe(401);
    expect(response.body.status).toBe('Access token required');

    expect(response.body.data).toBeNull();
  });

  it('Should return Tweet not found on like tweet', async () => {
    const response = await request(app).post(`${TWEETS_PATH}/2/likes`).set('Authorization', `bearer ${firstUserAccessToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.status).toBe('Tweet not found');

    expect(response.body.data).toBeNull();
  });

  it('Should return Tweet on like tweet', async () => {
    const payload = {
      text: 'My tweet 1',
    };
    const response = await request(app).post(`${TWEETS_PATH}/1/likes`).set('Authorization', `bearer ${secondUserAccessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.data.id).toBe(1);
    expect(response.body.data.text).toBe(payload.text);
    expect(response.body.data.likeCounter).not.toBe(0);
    expect(response.body.data.user.id).toBe(firstUser.id);
    expect(response.body.data.user.name).toBe(firstUser.name);
    expect(response.body.data.user.username).toBe(firstUser.username);
    expect(response.body.data.user.email).toBe(firstUser.email);
    expect(response.body.data.user.createdAt).not.toBeNull();
    expect(response.body.data.user.updatedAt).not.toBeNull();
    expect(response.body.data.user.lastLoginDate).toBeNull();

    expect(response.body.data.comments).not.toBeNull();

    expect(response.body.data.createdAt).not.toBeNull();
    expect(response.body.data.updatedAt).not.toBeNull();

    expect(response.body.paginationInfo).toBeNull();
  });

  it('Should return Tweet not found on post comments tweet', async () => {
    const payload = {
      text: 'My comment #1',
    };
    const response = await request(app).post(`${TWEETS_PATH}/2/comments`).send(payload).set('Authorization', `bearer ${firstUserAccessToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.status).toBe('Tweet not found');

    expect(response.body.data).toBeNull();
  });

  it('Should return Access token required on comments tweet', async () => {
    const payload = {
      text: 'My comment #1',
    };
    const response = await request(app).post(`${TWEETS_PATH}/1/comments`).send(payload);

    expect(response.statusCode).toBe(401);
    expect(response.body.status).toBe('Access token required');

    expect(response.body.data).toBeNull();
  });

  it('Should return Bad request on post comments tweet', async () => {
    const payload = {
      texto: 'My comment #1',
    };
    const response = await request(app).post(`${TWEETS_PATH}/1/comments`).send(payload).set('Authorization', `bearer ${secondUserAccessToken}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('Bad request');

    expect(response.body.data).toBeNull();
  });

  it('Should create comment', async () => {
    const payload = {
      text: 'My comment #1',
    };
    const response = await request(app).post(`${TWEETS_PATH}/1/comments`).send(payload).set('Authorization', `bearer ${secondUserAccessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.data.id).toBe(0);
    expect(response.body.data.text).toBe(payload.text);
    expect(response.body.data.likeCounter).toBe(0);
    expect(response.body.data.tweetId).toBe('1');
    expect(response.body.data.createdAt).not.toBeNull();
    expect(response.body.data.updatedAt).not.toBeNull();

    expect(response.body.paginationInfo).toBeNull();
  });

  it('Should return User not found on user feed', async () => {
    const response = await request(app).get(`${TWEETS_PATH}/feed/damn21`);

    expect(response.statusCode).toBe(404);
    expect(response.body.status).toBe('User not found');

    expect(response.body.data).toBeNull();
  });

  it('Should return User info on user feed', async () => {
    const payload = {
      text: 'My tweet 1',
    };
    const response = await request(app).get(`${TWEETS_PATH}/feed/user1`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.data[0].tweetId).not.toBeNull();
    expect(response.body.data[0].text).toBe(payload.text);
    expect(response.body.data[0].likeCounter).not.toBeNull();
    expect(response.body.data[0].user.id).toBe(firstUser.id);
    expect(response.body.data[0].user.name).toBe(firstUser.name);
    expect(response.body.data[0].user.username).toBe(firstUser.username);
    expect(response.body.data[0].user.email).toBe(firstUser.email);
    expect(response.body.data[0].user.createdAt).not.toBeNull();
    expect(response.body.data[0].user.updatedAt).not.toBeNull();
    expect(response.body.data[0].user.lastLoginDate).toBeNull();

    expect(response.body.data[0].comments).not.toBeNull();
  });
});
