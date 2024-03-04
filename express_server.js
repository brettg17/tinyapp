const express = require('express');
const app = express();
const PORT = 8080; //default port 8080

//Usee EJS as templating engine
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(); // Generate short URL
  const longURL = req.body.longURL; // Extract long URL from request body

  // Save shortURL-longURL pair to urlDatabase
  urlDatabase[shortURL] = longURL;

  // Respond with a redirect to /urls/:id
  res.redirect(`/urls/${shortURL}`);
});

// Route handler for handling requests to shortened URLs
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]; // Retrieve long URL from urlDatabase
  if (longURL) {
    // If the long URL exists, redirect to it
    res.redirect(longURL);
  } else {
    // If the long URL doesn't exist, send a 404 Not Found response
    res.status(404).send("URL not found");
  }
});

app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]}
   res.render("urls_show", templateVars);
});

app.post('/urls/:id/delete', (req, res) => {
    const idToDelete = req.params.id;
    delete urlDatabase[idToDelete];
    res.redirect('/urls');
});


//JSON string representing the entire urlDatabase object, 
//as it stands at the moment the request is made.
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

function generateRandomString() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port${PORT}!`);
});


