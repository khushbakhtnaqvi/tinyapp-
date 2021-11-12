const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function () {
  it('should return a user with valid email', function () {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user['id'], expectedUserID);
  });

  it('should returns a user object when provided with an email that exists in the database', function () {
    const user = getUserByEmail("user2@example.com", testUsers)
    const expectedUser = {
      id: "user2RandomID",
      email: "user2@example.com",
      password: "dishwasher-funk"
    }
    assert.deepEqual(user, expectedUser);
  });

  it('should return undefined for non-existent email', function () {
    const actual = getUserByEmail("user21@example.com", testUsers);
    assert.isUndefined(actual);
  });
});