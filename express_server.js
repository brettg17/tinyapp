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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

// Route to display URLs
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  const templateVars = {
    user: users[userID],
    urls: userURLs
  };
  res.render("urls_index", templateVars);
});

//route allows user to create a new url
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect('/login')
  }
  else {
  res.render("urls_new", {user: null});
  }
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
  if (!req.cookies["user_id"]) {
    res.status(403).send("You need to be logged in to shorten URLs");
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    const userID = req.cookies["user_id"]; // Get the logged-in user's ID

    // Save shortURL-longURL pair along with userID to urlDatabase
    urlDatabase[shortURL] = { longURL, userID };

    res.redirect(`/urls/${shortURL}`);
  }
});

// Update a url
app.post("/urls/:id", (req, res) => {
  const userID = req.cookies["user_id"];
  const idToUpdate = req.params.id;
  const updatedURL = req.body.longURL;

  // Check if the URL being updated belongs to the logged-in user
  if (urlDatabase[idToUpdate].userID !== userID) {
    return res.status(403).send("You don't have permission to update this URL");
  }

  urlDatabase[idToUpdate].longURL = updatedURL;

  res.redirect("/urls");
});


// Delete url from database
app.post('/urls/:id/delete', (req, res) => {
  const userID = req.cookies["user_id"];
  const idToDelete = req.params.id;

  // Check if the URL being deleted belongs to the logged-in user
  if (urlDatabase[idToDelete].userID !== userID) {
    return res.status(403).send("You don't have permission to delete this URL");
  }

  delete urlDatabase[idToDelete];
  res.redirect('/urls');
});

//route to login page
app.get('/login', (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect('/urls')
  }
  else {
  res.render("login", {user: null});
  }
})

//route to register page
app.get('/register', (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect('/urls')
  }
  else {
  res.render("register", {user: null});
  }
})

//route to login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check if user with given email exists
  const user = Object.values(users).find(user => user.email === email);

  //if either username or password are incorrect return status code 403
  if (!user || user.password !== password) {
    return res.status(403).send("Incorrect username or password...");
  }

  // Set user_id cookie with random ID for user
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

//route to handle registration
app.post('/register', (req, res) => {
  //extract email and password from request body
  const { email, password } = req.body;
  //if email or password incorrect then return status 400
  if (email === "" || password === "") {
    return res.status(400).send("neither Email or password fields can be an empty string");
  }
  //check if the user exists snd return status 400 if they do.
  for (const userId in users) {
    if (users[userId].email === email) {
      return res.status(400).send("This user already exists")
    }
  }
  //if unique email and password is not empty create new user. random string (6 characters) is created for id.
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

