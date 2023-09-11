const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;
const url = require('url');
const qs = require('querystring');



// Step 1: Redirect to GitHub's OAuth 2.0 authorization endpoint
app.get('/auth/github', (req, res) => {
  const githubAuthUrl = 'https://github.com/login/oauth/authorize';
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.REDIRECT_URI;
  const scope = 'openid read:user';  // or any other scope you need

  const authUrl = `${githubAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  
  res.redirect(authUrl);
});

// Step 2: GitHub redirects back to your site
app.get('/oauth2/idpresponse', async (req, res) => {
    const { code, state } = req.query;
  
    try {
      // Exchange code for an access token
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }, {
        headers: {
          'Accept': 'application/json',
        },
      });
  
      const { access_token: accessToken } = response.data;
  
      // Decode and parse the state parameter to get the returnTo URL
      const decodedState = Buffer.from(state, 'base64').toString('utf-8');
      const parsedState = JSON.parse(decodedState);
      const returnTo = parsedState.returnTo;
  
      // Extract hostname and port to modify the redirect URL
      const returnToUrl = new url.URL(returnTo);
      const returnToHostname = returnToUrl.hostname;
      const returnToPort = returnToUrl.port;
  
      // Create callback URL and append port if it exists
      const callbackUrl = returnToPort ? 
        `http://${returnToHostname}:${returnToPort}/api/callback` : 
        `http://${returnToHostname}/api/callback`;
  
      // Serialize the state and include it in the redirect URL
      const serializedState = qs.stringify({ state: decodedState });
      const redirectUrl = `${callbackUrl}?${serializedState}`;
  
      // Retrieve user's GitHub information
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
  
      // Log user data for demonstration purposes
      console.log('User Data:', userResponse.data);
  
      // Redirect the user to the new callback URL, including the state
      res.redirect(302, redirectUrl);
  
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error during GitHub OAuth');
    }
  });
  
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
