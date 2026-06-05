const RENDER_KEY = "rnd_uLEckdZtxqKLokXUuF5nu8egNlqW";

async function checkEnvVars() {
  const headers = {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json'
  };
  try {
    const servicesRes = await fetch('https://api.render.com/v1/services?name=gate-prep-backend', { headers });
    const servicesData = await servicesRes.json();
    const serviceId = servicesData[0].service.id;
    console.log("Service ID:", serviceId);

    const envRes = await fetch(`https://api.render.com/v1/services/${serviceId}/env-vars`, { headers });
    const envData = await envRes.json();
    console.log("Env Vars:");
    envData.forEach(e => console.log(` ${e.envVar.key} = ${e.envVar.value}`));
  } catch(e) {
    console.error(e);
  }
}

checkEnvVars();
