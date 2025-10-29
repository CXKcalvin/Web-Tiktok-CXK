const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const app = express();

const CLIENT_KEY = "sbawl03mbcrpgikzk4";
const CLIENT_SECRET = "29eXnSyHX4tGhTGwIzV7xrx7QLjrOu1x";
const REDIRECT_URI = "https://website-cxk.netlify.app/auth/tiktok/callback";

let CODE_VERIFIER = "";

function generateCodeChallenge() {
  CODE_VERIFIER = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(CODE_VERIFIER).digest("base64url");
  return hash;
}

app.get("/login/tiktok", (req, res) => {
  const codeChallenge = generateCodeChallenge();
  const tiktokAuthURL = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&state=random123&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  res.redirect(tiktokAuthURL);
});

app.get("/auth/tiktok/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.send("No code received.");

  try {
    const tokenRes = await axios.post("https://open-api.tiktok.com/oauth/token/", null, {
      params: {
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code_verifier: CODE_VERIFIER,
      },
    });

    const accessToken = tokenRes.data.data.access_token;

    const userInfo = await axios.get("https://open-api.tiktok.com/user/info/", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { fields: "open_id,avatar_url,display_name" },
    });

    const user = userInfo.data.data.user;
    res.send(`
      <h1>Profil TikTok</h1>
      <img src="${user.avatar_url}" width="100"><br>
      Username: ${user.display_name}
    `);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("Error saat autentikasi TikTok.");
  }
});

app.listen(3000, () => console.log("Server jalan di http://localhost:3000"));
