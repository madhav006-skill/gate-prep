const RENDER_KEY = "rnd_uLEckdZtxqKLokXUuF5nu8egNlqW";

async function getDeploys() {
  const headers = {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json'
  };
  try {
    const servicesRes = await fetch('https://api.render.com/v1/services?name=gate-prep-backend', { headers });
    const servicesData = await servicesRes.json();
    const serviceId = servicesData[0].service.id;

    const deploysRes = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys?limit=3`, { headers });
    const deploysData = await deploysRes.json();
    
    deploysData.forEach(d => {
      console.log(`Deploy ID: ${d.deploy.id}, Status: ${d.deploy.status}, Commit: ${d.deploy.commit?.id || 'N/A'}`);
    });

  } catch(e) {
    console.error(e);
  }
}

getDeploys();
