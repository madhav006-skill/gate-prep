const RENDER_KEY = "rnd_uLEckdZtxqKLokXUuF5nu8egNlqW";

async function deploy() {
  const headers = {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  try {
    const servicesRes = await fetch('https://api.render.com/v1/services?name=gate-prep-backend', { headers });
    const servicesData = await servicesRes.json();
    const serviceId = servicesData[0].service.id;

    console.log("Triggering deploy for:", serviceId);
    const deployRes = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys`, { 
      method: 'POST',
      headers,
      body: JSON.stringify({ clearCache: 'do_not_clear' })
    });
    const deployData = await deployRes.json();
    console.log("Deploy Status:", deployData);
  } catch(e) {
    console.error(e);
  }
}

deploy();
