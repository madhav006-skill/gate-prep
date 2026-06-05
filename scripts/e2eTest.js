// Simulating exactly what the browser does from frontend-murex-two-47.vercel.app
// VITE_API_URL = "https://gate-prep-backend.onrender.com"
// So baseURL becomes: https://gate-prep-backend.onrender.com + "/api" = https://gate-prep-backend.onrender.com/api

const BASE_URL = "https://gate-prep-backend.onrender.com/api";

async function testRegister() {
  console.log("=== Step 1: Register ===");
  const uniqueEmail = `testuser_${Date.now()}@gmail.com`;
  console.log("Testing with email:", uniqueEmail);

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Test User",
      email: uniqueEmail,
      password: "testpass123",
      targetYear: 2026,
      targetSubject: "CS"
    })
  });

  console.log("Register status:", regRes.status);
  const regData = await regRes.json();
  console.log("Register response:", JSON.stringify(regData));

  if (!regData.token) {
    console.log("❌ Registration FAILED - no token returned");
    return;
  }

  console.log("\n=== Step 2: Get current user (/auth/me) ===");
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${regData.token}` }
  });
  console.log("Me status:", meRes.status);
  const meData = await meRes.json();
  console.log("User:", JSON.stringify(meData));

  if (meData.success) {
    console.log("\n✅ ALL GOOD! Registration & login flow works perfectly!");
    console.log(`   User: ${meData.data.name} (${meData.data.email})`);
  } else {
    console.log("\n❌ FAILED at /auth/me");
  }
}

testRegister().catch(console.error);
