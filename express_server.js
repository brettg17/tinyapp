const express = require('express');
const app = express();
const PORT = 8080; //default port 8080
const cookieSession = require('cookie-session');
app.use(cookieSession( {
  name: "session",
  keys: ["key1", "key2"]
}));
const bcrypt = require("bcryptjs")
const { getUserByEmail } = require("./helper")

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

// Function to filter URLs for a given user ID
function urlsForUser(id) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
}

//route that will display "hello" when program initialized
app.get('/', (req, res) => {
  res.send("Hello!");
});

// Route to display URLs
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  
  if (!userID) {
    // User is not logged in, render the login prompt
    return res.render("login_prompt", { user: null });
  }

  const userURLs = urlsForUser(userID);
  
  const templateVars = {
    user: users[userID],
    urls: userURLs
  };
  res.render("urls_index", templateVars);
});

//route allows user to create a new url
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login')
  }
  else {
  res.render("urls_new", { user: users[req.session.user_id] });
  }
});

app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  // Ensuring we only proceed if the URL exists and belongs to the logged-in user.
  const url = urlDatabase[req.params.id];
  
  if (!userID) {
    // User is not logged in, render the login prompt
    return res.render("login_prompt", { user: null });
  }
  
  // Additionally, you may want to check if the URL exists and belongs to the user
  if (!url || url.userID !== userID) {
    // Handle the scenario where the URL doesn't exist or doesn't belong to the user
    return res.status(403).send("URL not found or you don't have permission to view it.");
  }

  const templateVars = {
    user,
    id: req.params.id,
    longURL: url.longURL,
  };

  res.render("urls_show", templateVars);
});

// Route handler for handling requests to shortened URLs
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL; // Retrieve long URL from urlDatabase
  if (longURL) {
    if (longURL.startsWith("http://") || longURL.startsWith("https://")) {
      res.redirect(longURL);
    }
    res.redirect("http://" + longURL);
  } else {
    res.status(404).send("URL not found");
  }
});

// create a new url
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).send("You need to be logged in to shorten URLs");
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    const userID = req.session.user_id; // Get the logged-in user's ID

    // Save shortURL-longURL pair along with userID to urlDatabase
    urlDatabase[shortURL] = { longURL, userID };

    res.redirect(`/urls/${shortURL}`);
  }
});

// Update a url
app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const idToUpdate = req.params.id;
  const updatedURL = req.body.longURL;

    // Check if the URL exists
    if (!urlDatabase[idToUpdate]) {
      return res.status(404).send("URL not found");
    }
  
    // Check if the user is logged in
    if (!userID) {
      return res.status(403).send("You need to be logged in to update URLs");
    }

  // Check if the URL being updated belongs to the logged-in user
  if (urlDatabase[idToUpdate].userID !== userID) {
    return res.status(403).send("You don't have permission to update this URL");
  }

  urlDatabase[idToUpdate].longURL = updatedURL;

  res.redirect("/urls");
});


// Delete url from database
app.post('/urls/:id/delete', (req, res) => {
  const userID = req.session.user_id;
  const idToDelete = req.params.id;

   // Check if the URL exists
   if (!urlDatabase[idToDelete]) {
    return res.status(404).send("URL not found");
  }

  // Check if the user is logged in
  if (!userID) {
    return res.status(403).send("You need to be logged in to delete URLs");
  }

  // Check if the URL being deleted belongs to the logged-in user
  if (urlDatabase[idToDelete].userID !== userID) {
    return res.status(403).send("You don't have permission to delete this URL");
  }

  delete urlDatabase[idToDelete];
  res.redirect('/urls');
});

//route to login page
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls')
  }
  else {
  res.render("login", {user: null});
  }
})

//route to register page
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls')
  }
  else {
  res.render("register", {user: null});
  }
})

// Route to login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = getUserByEmail(email, users);

  //if either username or password are incorrect return status code 403
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(403).send("Incorrect username or password...");
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

// Route to handle registration
app.post('/register', async (req, res) => {
  // Extract email and password from request body
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // If email or password is empty, return status 400
  if (email === "" || password === "") {
    return res.status(400).send("Neither Email nor password fields can be an empty string");
  }
  
  // Check if the user exists and return status 400 if they do
  for (const userId in users) {
    if (users[userId].email === email) {
      return res.status(400).send("This user already exists")
    }
  }
  
  // Generate a random user ID
  const userId = generateRandomString();
  
  // Create a new user object
  const newUser = {
    id: userId,
    email,
    password: hashedPassword
  };
  
  // Add the new user to the users object
  users[userId] = newUser;
  
  // Set user_id cookie with the generated ID
  req.session.user_id = userId;
  
  // Redirect to /urls
  res.redirect("/urls");
});
//route to logout
app.post("/logout", (req,res) => {
  req.session.user_id = null;
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

