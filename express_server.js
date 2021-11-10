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

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.post("/login", (req, res) => {  
  const username = req.body.username;
  console.log(username);
  res.cookie("username", username);
  res.redirect("/urls/");
});

app.post("/logout", (req, res) => {  
  const username = req.body.username;
  console.log(username);
  res.clearCookie('username')
  res.redirect("/urls/");
});

app.get("/urls/new", (req, res) => {
  templateVars = { username: req.cookies["username"] }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {  
  const longURL = req.body.longURL;
  const shortURL = generateRandomString()
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls/" + shortURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
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
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
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