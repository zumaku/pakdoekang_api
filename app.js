const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const transaksiRoutes = require('./routes/transaksiRoutes');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/api', transaksiRoutes);

// Database connection
mongoose.connect('mongodb://0.0.0.0:27017/pakdoekang').then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    printAllRoutes(app);
  });
}).catch(err => {
  console.error('Database connection error:', err);
});

// Function to print all routes
function printAllRoutes(app) {
    const routes = [];
    app._router.stack.forEach(middleware => {
      if (middleware.route) { // Route registered directly on the app
        routes.push(middleware.route);
      } else if (middleware.name === 'router') { // Router middleware
        middleware.handle.stack.forEach(handler => {
          const route = handler.route;
          route && routes.push(route);
        });
      }
    });
  
    console.log('Available routes:');
    routes.forEach(route => {
      const methods = Object.keys(route.methods).join(', ').toUpperCase();
      console.log(`${methods}: ${route.path}`);
    });
}
