const express = require('express');
const app = express();
const PORT = 8080; //default port 8080
const cookieParser = require('cookie-parser');
app.use(cookieParser());

//Usee EJS as templating engine
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

function generateRandomString() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

//route that will display "hello" when program initialized
app.get('/', (req, res) => {
  res.send("Hello!");
});

//route displays urls
app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

//route allows user to create a new url
app.get("/urls/new", (req, res) => {
  res.render("urls_new", {user: null});
});


app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});
// Route handler for handling requests to shortened URLs
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]; // Retrieve long URL from urlDatabase
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("URL not found");
  }
});

// create a new url
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(); // Generate short URL
  const longURL = req.body.longURL; // Extract long URL from request body

  // Save shortURL-longURL pair to urlDatabase
  urlDatabase[shortURL] = longURL;

  res.redirect(`/urls/${shortURL}`);
});

//update a url
app.post("/urls/:id", (req, res) => {
  const idToUpdate = req.params.id;
  const updatedURL = req.body.longURL;

  urlDatabase[idToUpdate] = updatedURL;

  res.redirect("/urls");

})
//delete url from database
app.post('/urls/:id/delete', (req, res) => {
  const idToDelete = req.params.id;
  delete urlDatabase[idToDelete];
  res.redirect('/urls');
});

//route to login page
app.get('/login', (req, res) => {
  res.render("login", {user: null});
})

//route to register page
app.get('/register', (req, res) => {
  res.render("register", {user: null});
})

//route to login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check if user with given email exists
  const user = Object.values(users).find(user => user.email === email);

  if (!user) {
    return res.status(403).send("User with that email not found");
  }
  if (user.password !== password) {
    return res.status(403).send("Incorrect password");
  }

  // Set user_id cookie with random ID for user
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

//route to handle registration
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  
  if (email === "" || password === "") {
    return res.status(400).send("neither Email or password fields can be an empty string");
  }
  for (const userId in users) {
    if (users[userId].email === email) {
      return res.status(400).send("This user already exists")
    }
  }

  const userId = generateRandomString();

  const newUser = {
    id: userId,
    email,
    password
  };
  
  users[userId] = newUser;

  res.cookie("user_id", userId);
  res.redirect("/urls")

});
//route to logout
app.post("/logout", (req,res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

//JSON string representing the entire urlDatabase object, 
//as it stands at the moment the request is made.
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port${PORT}!`);
});

