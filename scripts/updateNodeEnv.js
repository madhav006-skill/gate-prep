const RENDER_KEY = "rnd_uLEckdZtxqKLokXUuF5nu8egNlqW";

async function updateEnv() {
  const headers = {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  try {
    // 1. Fetch all services
    const servicesRes = await fetch('https://api.render.com/v1/services', { headers });
    const services = await servicesRes.json();
    
    // Find Node backend
    const nodeService = services.find(s => s.service.name === 'gate-prep-backend');
    if (!nodeService) throw new Error("Could not find gate-prep-backend service");
    const serviceId = nodeService.service.id;

    // 2. Fetch current env vars
    const envRes = await fetch(`https://api.render.com/v1/services/${serviceId}/env-vars`, { headers });
    const envData = await envRes.json();

    // 3. Update env vars with PYTHON_API_URL
    const newEnvVars = envData.map(e => ({ key: e.envVar.key, value: e.envVar.value }));
    // Remove if exists
    const filtered = newEnvVars.filter(e => e.key !== 'PYTHON_API_URL');
    
    filtered.push({ key: 'PYTHON_API_URL', value: 'https://gate-prep-python-ocr.onrender.com' });

    console.log("Updating Node.js env vars on Render...");
    const updateRes = await fetch(`https://api.render.com/v1/services/${serviceId}/env-vars`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(filtered)
    });
    
    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(JSON.stringify(err));
    }
    
    console.log("Successfully linked Node backend to Python backend! Node backend will now reboot.");
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

updateEnv();
