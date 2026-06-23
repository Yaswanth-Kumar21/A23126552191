const axios = require("axios");
const { CLIENT_ID, CLIENT_SECRET, BASE_URL } = require("./config");

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && tokenExpiry && now < tokenExpiry - 60) {
    return cachedToken;
  }

  const response = await axios.post(`${BASE_URL}/auth`, {
    email: "abotulayaswanthkumar.23.csm@anits.edu.in",
    name: "abotula yaswanth kumar",
    rollNo: "a23126552191",
    accessCode: "MTqxar",
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET
  });

  cachedToken = response.data.access_token;
  tokenExpiry = response.data.expires_in;

  return cachedToken;
}

module.exports = { getAccessToken };
