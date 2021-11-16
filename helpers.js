// Function to generate random unique string for short URL id and unique user id
function generateRandomString() {
  let shortUrl = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charsLen = chars.length;
  for (var i = 0; i < 6; i++) {
    shortUrl += chars.charAt(Math.floor(Math.random() * charsLen));
  }
  return shortUrl;
}

// Function to get user details through the entered email
function getUserByEmail(email, users) {
  for (let key in users) {
    if (users[key]["email"] === email) {
      return users[key];
    }
  }
  return undefined;
}

// filters urls for the logged in user
function urlsForUser(urlDatabase, id) {
  console.log('Test27-in urlsForUser-urlDatabase: ');
  console.log(urlDatabase);
  const cloneUrlDatabase = Object.assign({}, urlDatabase);
  for (let key in cloneUrlDatabase) {
    if (cloneUrlDatabase[key]["userID"] !== id) {
      delete cloneUrlDatabase[key];
    }
  }
  return cloneUrlDatabase;
}

module.exports = { generateRandomString, getUserByEmail, urlsForUser };