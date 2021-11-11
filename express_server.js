const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

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
    password: "sweets-are-great"
  },
 "user2": {
    id: "user2",
    email: "tangled@domino.com", 
    password: "rainy-season"
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

app.get("/register", (req, res) => {
  const id = req.cookies["user_id"];
  const templateVars = { user: users[id] };
  res.render("urls_register", templateVars);
});

function getUserByEmail(email)
{
  for (let key in users) {
    if (users[key]["email"] === email) {
      return users[key];
    }
  }
  return false;
}

app.post("/register", (req, res) => {
  // console.log('users before adding new user:');
  // console.log(users);

  const {email, password} = req.body;
  if (email === '' || password === '') {
    res.status(400).send("Email and password should not be empty!");
    return;
  }
  
  if (getUserByEmail(email)) {
    res.status(400).send("Email already exists!");
    return;
  }

  const id = generateRandomString();
  users[id] = {id, email, password};

  // console.log('users after adding new user:');
  // console.log(users);
  
  res.cookie("user_id", id);
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
  const id = req.cookies["user_id"];
  if (!id) {
    res.status(403).send("<b>User Not Logged In!</b>");
    return;
  }

  const userUrlDatabase = urlsForUser(id);
  const templateVars = { urls: userUrlDatabase, user: users[id] };
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  const id = req.cookies["user_id"];
  const templateVars = { urls: urlDatabase, user: users[id] };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  // console.log('users:');
  // console.log(users);

  const {email, password} = req.body;
  // if (email === '' || password === '') {
  //   res.status(400).send("Email and password should not be empty!");
  // }
  
  const user = getUserByEmail(email);
  if (!user) {
    // console.log('Test105-emailnotfound');
    res.status(403).send("Email cannot be found!");
    return;
  }

  if (password !== user.password) {
    // console.log('Test106-passwordnotmatch');
    res.status(403).send("Password does not match!");
    return;
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {  
  res.clearCookie("user_id")
  res.redirect("/login");
});

app.get("/urls/new", (req, res) => {
  const id = req.cookies["user_id"];
  if (!id) {
    res.redirect("/login");
    return;
  }
  const templateVars = { user: users[id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {  
  const id = req.cookies["user_id"];
  if (!id) {
    res.status(403).send("Access forbidden. User not logged in!");
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
  const id = req.cookies["user_id"];
  const shortURL = req.params.shortURL;
  //const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]["longURL"], user: users[id] };
  res.redirect(urlDatabase[shortURL]["longURL"]);
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.cookies["user_id"];
  if (!id) {
    res.status(403).send("User not logged in!");
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

// app.post("/urls/:shortURL", (req, res) => {
//   const id = req.cookies["user_id"];
//   if (!id) {
//     res.redirect("/login");
//     return;
//   }
//   const longURL = urlDatabase[req.params.shortURL]["longURL"];
//   res.redirect(longURL);
// });

app.post("/urls/:shortURL/delete", (req,res)=>{
  const id = req.cookies["user_id"];
  if (!id) {
    res.status(403).send("User not logged in!");
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

// app.get("/urls/:shortURL/update", (req, res) => {
//   const id = req.cookies["user_id"];
//   if (!id) {
//     res.redirect("/login");
//     return;
//   }
//   const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"], user: users[id] };
//   res.render("urls_show", templateVars);
// });

app.post("/urls/:shortURL", (req,res)=>{
  const id = req.cookies["user_id"];
  if (!id) {
    res.status(403).send("User not logged in!");
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