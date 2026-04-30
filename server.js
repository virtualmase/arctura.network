const express = require('express');
const path = require('path');
const app = express();

// Serve all static files from the root directory
app.use(express.static(path.join(__dirname)));

// Route / to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route /faq to faq.html
app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, 'faq.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Arctura server running on port ${PORT}`);
});
