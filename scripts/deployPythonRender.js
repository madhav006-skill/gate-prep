const RENDER_KEY = "rnd_uLEckdZtxqKLokXUuF5nu8egNlqW";
const REPO = "https://github.com/madhav006-skill/gate-prep";

async function deploy() {
  const headers = {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  try {
    const ownersRes = await fetch('https://api.render.com/v1/owners', { headers });
    const ownersData = await ownersRes.json();
    const ownerId = ownersData[0].owner.id;

    console.log("Owner ID:", ownerId);

    const payload = {
      type: "web_service",
      name: "gate-prep-python-ocr",
      ownerId: ownerId,
      repo: REPO,
      autoDeploy: "yes",
      branch: "main",
      rootDir: "backend-pdf",
      serviceDetails: {
        env: "python",
        plan: "free",
        region: "oregon",
        envSpecificDetails: {
          buildCommand: "pip install -r requirements.txt",
          startCommand: "uvicorn main:app --host 0.0.0.0 --port 10000"
        }
      }
    };

    console.log("Creating Render Web Service for Python OCR...");
    const createRes = await fetch('https://api.render.com/v1/services', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(JSON.stringify(createData));

    console.log("Success! Render URL:", createData.service.serviceDetails.url);
    
    // Save URL to a file so we can read it in the next steps
    require('fs').writeFileSync('python_render_url.txt', createData.service.serviceDetails.url);

  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

deploy();
