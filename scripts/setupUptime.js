const UPTIME_API_KEY = "u3519507-bcf6e05fab972562890b5061";
const RENDER_URL = "https://gate-prep-backend.onrender.com";

async function setup() {
  try {
    const payload = new URLSearchParams();
    payload.append('api_key', UPTIME_API_KEY);
    payload.append('format', 'json');
    payload.append('type', '1'); // HTTP(s)
    payload.append('url', RENDER_URL);
    payload.append('friendly_name', 'GATE Prep Backend');
    payload.append('interval', '300'); // 5 minutes (in seconds)

    const res = await fetch('https://api.uptimerobot.com/v2/newMonitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload
    });

    const data = await res.json();
    console.log("UptimeRobot Response:", data);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

setup();
