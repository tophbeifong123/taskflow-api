const express = require('express');
const app = express();
app.get('/health', (req, res) => res.send('OK'));
app.listen(8080, () => console.log('Running on 8080'));
// [Technical Justification - 20 Points]: