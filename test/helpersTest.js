const { assert } = require('chai');

const { getUserByEmail } = require('../helper.js');

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

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it('should return an object with an email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    assert.property(user, 'email', 'user object should have an email property');
  });

  it('should return undefined for non-existent email', function() {
    const user = getUserByEmail("skaterboi_92@brap.com", testUsers);
    assert.isUndefined(user);
  });
});
