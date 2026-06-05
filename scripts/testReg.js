async function test() {
  try {
    const res = await fetch('https://gate-prep-backend.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Aman kumar",
        email: "amankumar552023@gmail.com",
        password: "password123"
      })
    });
    console.log("Status:", res.status);
    const data = await res.text();
    console.log("Data:", data);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
