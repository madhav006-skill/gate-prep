const RENDER_KEY = "rnd_uLEckdZtxqKLokXUuF5nu8egNlqW";

async function enableAutoDeploy() {
  const headers = {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  // Get service ID
  const servicesRes = await fetch('https://api.render.com/v1/services?name=gate-prep-backend', { headers });
  const servicesData = await servicesRes.json();
  const serviceId = servicesData[0].service.id;
  console.log("Service ID:", serviceId);

  // Update service to enable auto deploy
  const updateRes = await fetch(`https://api.render.com/v1/services/${serviceId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ autoDeploy: 'yes' })
  });

  const updateData = await updateRes.json();
  console.log("Update status:", updateRes.status);
  console.log("Auto Deploy:", updateData.service?.autoDeploy || updateData.autoDeploy || JSON.stringify(updateData));
}

enableAutoDeploy().catch(console.error);
