const RENDER_KEY = "rnd_uLEckdZtxqKLokXUuF5nu8egNlqW";

async function checkDeploy() {
  const headers = {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json'
  };

  try {
    const servicesRes = await fetch('https://api.render.com/v1/services?name=gate-prep-backend', { headers });
    const servicesData = await servicesRes.json();
    const serviceId = servicesData[0].service.id;

    console.log("Service ID:", serviceId);

    const deploysRes = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys?limit=1`, { headers });
    const deploysData = await deploysRes.json();
    const latestDeploy = deploysData[0].deploy;

    console.log("Latest Deploy Status:", latestDeploy.status);
    
    // Get logs if failed
    if (latestDeploy.status === 'build_failed' || latestDeploy.status === 'update_failed') {
       console.log("Deploy Failed. ID:", latestDeploy.id);
    }

  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

checkDeploy();
