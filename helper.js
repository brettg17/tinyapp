const getUserByEmail = function(email, usersDatabase) {
  for (const userId in usersDatabase) {
    const user = usersDatabase[userId];
    if (user.email === email) { 
      return user;
    }
  }
  return null;
};

module.exports = { getUserByEmail };