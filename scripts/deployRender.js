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
      name: "gate-prep-backend",
      ownerId: ownerId,
      repo: REPO,
      autoDeploy: "yes",
      branch: "main",
      rootDir: "backend",
      envVars: [
        { key: "NODE_ENV", value: "production" },
        { key: "MONGODB_URI", value: "mongodb+srv://amankumar552023_db_user:1eL5p5LjkbsVW0Oj@cluster69.e6ghl6v.mongodb.net/gateprep?retryWrites=true&w=majority&appName=Cluster69" },
        { key: "CLOUDINARY_CLOUD_NAME", value: "drihfedip" },
        { key: "CLOUDINARY_API_KEY", value: "167339479194528" },
        { key: "CLOUDINARY_API_SECRET", value: "yfo8hhTDzwdKgoHjYO76YodfVbs" },
        { key: "JWT_SECRET", value: "gate_prep_super_secure_jwt_secret_2026_xoxo" }
      ],
      serviceDetails: {
        env: "node",
        plan: "free",
        region: "oregon",
        envSpecificDetails: {
          buildCommand: "npm install",
          startCommand: "npm start"
        }
      }
    };

    console.log("Creating Render Web Service...");
    const createRes = await fetch('https://api.render.com/v1/services', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(JSON.stringify(createData));

    console.log("Success! Render URL:", createData.service.serviceDetails.url);
    
    // Save URL to a file so we can read it in the next steps
    require('fs').writeFileSync('render_url.txt', createData.service.serviceDetails.url);

  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

deploy();
