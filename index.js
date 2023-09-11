const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.YOUR_GITHUB_CLIENT_SECRET,
      code
    }, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const accessToken = response.data.access_token;
    
    // Do something with the access token (store it, use it to access GitHub API, etc.)
    res.send(`Access token: ${accessToken}`);
  } catch (error) {
    res.status(500).send('Error during GitHub OAuth');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
