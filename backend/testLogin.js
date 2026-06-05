async function testLogin() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'amankumar552023@gmail.com', password: 'password123' })
    });
    console.log(res.status, await res.json());
  } catch(e) { console.error(e); }
}
testLogin();
