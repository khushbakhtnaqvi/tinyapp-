const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.get("/urls/register", (req, res) => {
  const id = req.cookies["user_id"];
  const templateVars = { urls: urlDatabase, user: users[id] };
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
  }
  
  if (getUserByEmail(email)) {
    res.status(400).send("Email already exists!");
  }

  const id = generateRandomString();
  users[id] = {id, email, password};

  // console.log('users after adding new user:');
  // console.log(users);
  
  res.cookie("user_id", id);
  res.redirect("/urls");
  
})

app.get("/urls", (req, res) => {
  const id = req.cookies["user_id"];
  const templateVars = { urls: urlDatabase, user: users[id] };
  res.render("urls_index", templateVars);
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
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  const id = req.cookies["user_id"];
  const templateVars = { user: users[id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {  
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls/" + shortURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[id] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req,res)=>{
  const idToDelete = req.params.shortURL;
  delete urlDatabase[idToDelete];
  res.redirect("/urls");
});

app.get("/urls/:shortURL/update", (req, res) => {
  const id = req.cookies["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[id] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/update", (req,res)=>{
  const newLongURL = req.body.newLongURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = newLongURL;
  res.redirect("/urls");
});

app.get('*', (req, res) => {
  res.status(300).send("Page Does Not Exist !!!");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});