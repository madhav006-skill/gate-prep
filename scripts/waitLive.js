const RENDER_KEY = "rnd_uLEckdZtxqKLokXUuF5nu8egNlqW";

async function waitForLive() {
  const headers = {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json'
  };
  const servicesRes = await fetch('https://api.render.com/v1/services?name=gate-prep-backend', { headers });
  const servicesData = await servicesRes.json();
  const serviceId = servicesData[0].service.id;

  while(true) {
    const deploysRes = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys?limit=1`, { headers });
    const deploysData = await deploysRes.json();
    const status = deploysData[0].deploy.status;
    
    console.log(`Current Status: ${status}`);
    if (status === 'live' || status === 'build_failed' || status === 'update_failed') {
      process.exit(0);
    }
    // sleep 10s
    await new Promise(r => setTimeout(r, 10000));
  }
}

waitForLive();
