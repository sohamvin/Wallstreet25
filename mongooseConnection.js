// db.js
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI; // Update as per your environment

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Export the mongoose instance (or just mongoose.connection if preferred)
module.exports = mongoose;
