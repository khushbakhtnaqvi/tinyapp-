const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {  
  const longURL = req.body.longURL;
  const shortURL = generateRandomString()
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls/" + shortURL);
});
//<a href=<%= longURL %>><%= shortURL %></a></p>
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// app.post("/u/:shortURL/delete", (req, res) => {
//   const deletionId = req.params.shortURL;
//   delete urlDatabase[deletionId];
//   res.redirect("/urls");
// });

app.post("/urls/:shortURL/delete", (req,res)=>{
  const idToDelete = req.params.shortURL;
  delete urlDatabase[idToDelete];
  res.redirect("/urls");
});

app.get('*', (req, res) => {
  res.status(300).send("Page Does Not Exist !!!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});