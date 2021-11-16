const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers") // helper functions
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session'); // for session cookies
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs'); // for password encryption
var morgan = require('morgan') // middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // ejs view engine
app.use(morgan("dev")); // middleware
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
})) // session cookies

// URL Database
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user1"
  },

  "9sm5xK": {
    longURL: "http://www.google.ca",
    userID: "user1"
  }
}

// User Database
const users = {
  "user1": {
    id: "user1",
    email: "cindrella@abc.com",
    password: "$2a$08$usqL6.NYcS/pBJysWOK/lOxbUawGJ.8u.iiyeQPaOALqQMBqfNFZK" //sweets-are-great
  },
  "user2": {
    id: "user2",
    email: "tangled@domino.com",
    password: "$2a$08$HSvTJu9ODWikzDFArTdUIOWuGaGhxlCJrWWeNXmbhPDtcCiN1tq9i" //rainy-season
  }
}

// get request and redirection upon getting root "/" endpoint
app.get("/", (req, res) => {
  const id = req.session.user_id;

  //check if user is logged in then redirect to "/urls" endpoint else redirect to login page
  if (id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//get request for "/register" endpoint
app.get("/register", (req, res) => {
  const id = req.session.user_id; // assigns session id to a user
  const templateVars = { user: users[id] };
  res.render("urls_register", templateVars);
});

// post request for "/register" endpoint
app.post("/register", (req, res) => {
  let { email, password } = req.body; // gets email and password enter by user for registeration
  if (email === '' || password === '') {
    res.status(400).send("Email and password should not be empty! Please <a href='/register'>try again</a>!");
    return;
  }

  // calling function at registration time to check if email already exists
  if (getUserByEmail(email, users)) {
    res.status(400).send("Email already exists! Please <a href='/register'>try again</a>!");
    return;
  }

  const id = generateRandomString();   // calling function to generate random string for unique user id
  password = bcrypt.hashSync(password, 8); // password hashing
  users[id] = { id, email, password };
  const user = users[id];
  req.session.user_id = user.id; // assign user id to session
  res.redirect("/urls");

});

// get request for "/urls" endpoint
app.get("/urls", (req, res) => {
  const id = req.session.user_id;

  // check if user is logged in
  if (!id) {
    res.status(403).send("User Not Logged In! Please <a href='/login'>login</a>!");
    return;
  }

  // if user is logged go to "/urls" endpoint
  const userUrlDatabase = urlsForUser(urlDatabase, id);
  const templateVars = { urls: userUrlDatabase, user: users[id] };
  res.render("urls_index", templateVars);
});

// get request for "/login" endpoint
app.get("/login", (req, res) => {
  const id = req.session.user_id;
  const templateVars = { urls: urlDatabase, user: users[id] };
  res.render("urls_login", templateVars);
});

//post request for "/login" endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  // check if user does not exist
  if (!user) {
    res.status(403).send("Email cannot be found! Please <a href='/login'>try again</a>!");
    return;
  }

  // check if there is a password mismatch
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Wrong Password! Please <a href='/login'>try again</a>!");
    return;
  }

  // if user exists and password matches, redirect to "/urls" endpoint
  req.session.user_id = user.id;
  res.redirect("/urls");
});

// post request for "/logout" endpoint
app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/login");
});

// get request for "/urls/new" endpoint
app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;

  // check if user is not logged in then redirect to "/login" endpoint
  if (!id) {
    res.redirect("/login");
    return;
  }
  const templateVars = { user: users[id] };
  res.render("urls_new", templateVars); // if user logged in then redirect to "/urls/new" endpoint
});

// post request for "/urls" endpoint
app.post("/urls", (req, res) => {
  const id = req.session.user_id;

  // check if user not logged in then throw error
  if (!id) {
    res.status(403).send("Access forbidden. User not logged in! Please <a href='/login'>login</a>!");
    return;
  }

  // if user logged in then generate short URL id and redirect to "/url" endpoint
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL]["longURL"] = longURL;
  urlDatabase[shortURL]["userID"] = id;
  res.redirect("/urls/" + shortURL);
});

// redirects any user to entered shortURL
app.get("/u/:shortURL", (req, res) => {
  const id = req.session.user_id;
  const shortURL = req.params.shortURL;

  // if shortURL does not exist return error
  if (!urlDatabase[shortURL]) {
    res.status(403).send("URL does not exist!");
    return;
  }
  // if shortURL exist redirect to the corresponding longURL
  const longURL = urlDatabase[shortURL]['longURL'];
  res.redirect(longURL);
});

// get request for "/urls/:shortURL" endpoint
app.get("/urls/:shortURL", (req, res) => {
  const id = req.session.user_id;

  // check if user is logged in
  if (!id) {
    res.status(403).send("User not logged in! Please <a href='/login'>login</a>!");
    return;
  }

  const shortURL = req.params.shortURL;

  // check if shortURL exists
  if (!urlDatabase[shortURL]) {
    res.status(403).send("URL does not exist!");
    return;
  }

  // check if shortURL belongs to the logged in user
  if (urlDatabase[shortURL]["userID"] != id) {

    res.status(403).send("Access forbidden. URL does not belong to logged in user!");
    return;
  }

  // if user is logged in and shortURL belongs to user go to "/urls/:shortURL" endpoint
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]["longURL"], user: users[id] };
  res.render("urls_show", templateVars);
});

// post request to delete a shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.session.user_id;

  // check if user is logged in
  if (!id) {
    res.status(403).send("User not logged in! Please <a href='/login'>login</a>!");
    return;
  }

  // check if shortURL belongs to the logged in user
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]["userID"] !== id) {
    res.status(403).send("Access forbidden. URL does not belong to logged in user!");
    return;
  }

  // if user is logged in and shortURL belongs to user delete the given shortURL
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// post request for updating the longURL against a shortURL
app.post("/urls/:shortURL", (req, res) => {
  const id = req.session.user_id;

  // check if shortURL belongs to the logged in user
  if (!id) {
    res.status(403).send("User not logged in! Please <a href='/login'>login</a>!");
    return;
  }

  // check if shortURL belongs to the logged in user
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]["userID"] !== id) {
    res.status(403).send("Access forbidden. URL does not belong to logged in user!");
    return;
  }

  // if user is logged in and shortURL belongs to user go to "/urls/:shortURL" endpoint
  const newLongURL = req.body.newLongURL;
  urlDatabase[shortURL]["longURL"] = newLongURL;
  res.redirect("/urls");
});

// if user enters anything else than the defined endpoints throw error
app.get('*', (req, res) => {
  res.status(300).send("Page Does Not Exist !!!");
});

// server starts listening
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});