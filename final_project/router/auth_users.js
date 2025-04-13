const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
    //write code to check is the username is valid
    return users.some(user => user.username === username);
}

const authenticatedUser = (username,password)=>{ //returns boolean
    //write code to check if username and password match the one we have in records.
    return users.some(user => 
        user.username === username && 
        user.password === password
    );
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  // Authenticate user
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login credentials" });
  }

  const accessToken = jwt.sign(
    { data: password }, 
    'access', 
    { expiresIn: 60 * 60 }
  );


  req.session.authorization = {
    accessToken,
    username
  };

  return res.status(200).json({ message: "User successfully logged in" });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here
  const isbn = req.params.isbn;
  const reviewText = req.query.review;
  const username = req.session.authorization?.username;

  if (!username) {
    return res.status(403).json({ message: "User not authenticated" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }


  const existingReviewIndex = books[isbn].reviews.findIndex(
    review => review.user === username
  );

  if (existingReviewIndex !== -1) {
    books[isbn].reviews[existingReviewIndex].text = reviewText;
    return res.status(200).json({ message: "Review updated successfully" });
  }

  books[isbn].reviews.push({
    user: username,
    text: reviewText,
    timestamp: new Date().toISOString()
  });

  return res.status(200).json({ message: "Review added successfully" });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization?.username;
  
    if (!username) {
      return res.status(403).json({ message: "User not authenticated" });
    }
  
    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!Array.isArray(books[isbn].reviews)) {
      books[isbn].reviews = [];
    }
  
    const initialReviewCount = books[isbn].reviews.length;

    books[isbn].reviews = books[isbn].reviews.filter(
      review => review.user !== username
    );
  
    if (books[isbn].reviews.length < initialReviewCount) {
      return res.status(200).json({ message: "Review(s) deleted successfully" });
    }
    
    return res.status(404).json({ message: "No reviews found to delete" });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
