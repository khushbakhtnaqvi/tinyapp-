const {getUserByEmail} = require("./helpers")
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
var morgan = require('morgan')
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

const urlDatabase = {
  "b2xVn2": {
    longURL:  "http://www.lighthouselabs.ca",
    userID: "user1"
  },
 
  "9sm5xK": {
    longURL:  "http://www.google.ca",
    userID: "user1"
  }
}

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

function generateRandomString() {
  let shortUrl           = '';
  const chars       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charsLen = chars.length;
  for ( var i = 0; i < 6; i++ ) {
    shortUrl += chars.charAt(Math.floor(Math.random() * charsLen));
 }
 return shortUrl;
}

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  const id = req.session.user_id;
  if (id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/register", (req, res) => {
  const id = req.session.user_id;
  const templateVars = { user: users[id] };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let {email, password} = req.body;
  if (email === '' || password === '') {
    res.status(400).send("Email and password should not be empty! Please <a href='/register'>try again</a>!");
    return;
  }
  
  if (getUserByEmail(email, users)) {
    res.status(400).send("Email already exists! Please <a href='/register'>try again</a>!");
    return;
  }

  const id = generateRandomString();
  password = bcrypt.hashSync(password, 8);
  users[id] = {id, email, password};
  const user = users[id];
  req.session.user_id = user.id;
  res.redirect("/urls");
  
});

function urlsForUser(id)
{
  const cloneUrlDatabase = Object.assign({}, urlDatabase);
  for (let key in cloneUrlDatabase) {
    if (cloneUrlDatabase[key]["userID"] !== id) {
      delete cloneUrlDatabase[key];
    }
  }
  return cloneUrlDatabase;
}

app.get("/urls", (req, res) => {
  const id = req.session.user_id;
  if (!id) {
    res.status(403).send("User Not Logged In! Please <a href='/login'>login</a>!");
    return;
  }

  const userUrlDatabase = urlsForUser(id);
  const templateVars = { urls: userUrlDatabase, user: users[id] };
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  const id = req.session.user_id;
  const templateVars = { urls: urlDatabase, user: users[id] };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  const user = getUserByEmail(email, users);
  if (!user) {
    res.status(403).send("Email cannot be found! Please <a href='/login'>try again</a>!");
    return;
  }

  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Password does not match! Please <a href='/login'>try again</a>!");
    return;
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/login");
});

app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  if (!id) {
    res.redirect("/login");
    return;
  }
  const templateVars = { user: users[id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {  
  const id = req.session.user_id;
  if (!id) {
    res.status(403).send("Access forbidden. User not logged in! Please <a href='/login'>login</a>!");
    return;
  }
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL]["longURL"] = longURL;
  urlDatabase[shortURL]["userID"] = id;
  res.redirect("/urls/" + shortURL);
});

app.get("/u/:shortURL", (req, res) => {
  const id = req.session.user_id;
  const shortURL = req.params.shortURL;
  res.redirect(urlDatabase[shortURL]["longURL"]);
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.session.user_id;
  if (!id) {
    res.status(403).send("User not logged in! Please <a href='/login'>login</a>!");
    return;
  }

  const shortURL = req.params.shortURL;
  const userUrlDatabase = urlsForUser(id);
  if (userUrlDatabase[shortURL]["userID"] !== id) {
    res.status(403).send("Access forbidden. URL does not belong to logged in user!");
    return;
  }

  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]["longURL"], user: users[id] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req,res)=>{
  const id = req.session.user_id;
  if (!id) {
    res.status(403).send("User not logged in! Please <a href='/login'>login</a>!");
    return;
  }

  const shortURL = req.params.shortURL;
  const userUrlDatabase = urlsForUser(id);
  if (userUrlDatabase[shortURL]["userID"] !== id) {
    res.status(403).send("Access forbidden. URL does not belong to logged in user!");
    return;
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req,res)=>{
  const id = req.session.user_id;
  if (!id) {
    res.status(403).send("User not logged in! Please <a href='/login'>login</a>!");
    return;
  }

  const shortURL = req.params.shortURL;
  const userUrlDatabase = urlsForUser(id);
  if (userUrlDatabase[shortURL]["userID"] !== id) {
    res.status(403).send("Access forbidden. URL does not belong to logged in user!");
    return;
  }

  const newLongURL = req.body.newLongURL;
  urlDatabase[shortURL]["longURL"] = newLongURL;
  res.redirect("/urls");
});

app.get('*', (req, res) => {
  res.status(300).send("Page Does Not Exist !!!");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});