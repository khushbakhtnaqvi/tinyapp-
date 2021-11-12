function getUserByEmail(email, users)
{
  for (let key in users) {
    if (users[key]["email"] === email) {
      return users[key];
    }
  }
  return undefined;
}
module.exports = {getUserByEmail};