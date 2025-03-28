const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(bodyParser.json());

// Secret key (in a real application, use a secure environment variable)
const SECRET_KEY = 'my_secret_key';

// Basic route
app.get('/api', function(req, res) {
    res.json({
        text: 'my api oh my'
    });
});

// Login route
app.post('/api/login', function(req, res) {
    // This is a simplified authentication 
    // In a real app, you'd validate credentials from a database
    const user = { 
        id: 3, 
        username: 'example_user' 
    };

    const token = jwt.sign({ user }, SECRET_KEY, { expiresIn: '1h' });
    
    res.json({
        message: 'Authentication successful',
        token: token
    });
});

// Middleware to ensure token is present
function ensureToken(req, res, next) {
    const bearerHeader = req.headers["authorization"];
    
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

// Protected route
app.get('/api/protected', ensureToken, function(req, res) {
    jwt.verify(req.token, SECRET_KEY, function(err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            res.json({
                text: 'this is protected, walk away',
                data: data
            });
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log(`App is listening on port ${PORT}!`);
});

module.exports = app;