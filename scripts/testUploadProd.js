const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function runTest() {
  const PYTHON_URL = 'https://gate-prep-python-ocr.onrender.com/api/pdf/upload';
  
  try {
    const pdfPath = 'dummy_test.pdf';
    if (!fs.existsSync(pdfPath)) {
      fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n');
    }

    console.log("Uploading PDF directly to Python OCR...");
    const form = new FormData();
    form.append('file', fs.createReadStream(pdfPath));

    const uploadRes = await axios.post(PYTHON_URL, form, {
      headers: form.getHeaders(),
      timeout: 10000 // 10s timeout
    });

    console.log("Upload Success! Job ID:", uploadRes.data.job_id);
    
  } catch (err) {
    console.error("Test Failed:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

runTest();
