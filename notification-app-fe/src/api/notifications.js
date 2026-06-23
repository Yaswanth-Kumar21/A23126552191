const BASE_URL = "http://4.224.186.213/evaluation-service";

const CLIENT_ID = "6495ed39-8c36-48de-bf59-9506dcc5eea5";
const CLIENT_SECRET = "upQnrNGMWFHdfrmW";

let cachedToken = null;
let tokenExpiry = null;

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiry && now < tokenExpiry - 60) {
    return cachedToken;
  }

  const res = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "abotulayaswanthkumar.23.csm@anits.edu.in",
      name: "abotula yaswanth kumar",
      rollNo: "a23126552191",
      accessCode: "MTqxar",
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    })
  });

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = data.expires_in;
  return cachedToken;
}

export async function fetchNotifications({ page = 1, limit = 10, notification_type } = {}) {
  const token = await getToken();

  const params = new URLSearchParams({ page, limit });
  if (notification_type && notification_type !== "All" && notification_type !== undefined) {
    params.append("notification_type", notification_type);
  }

  const res = await fetch(`${BASE_URL}/notifications?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch notifications: ${res.status}`);
  }

  return res.json();
}
