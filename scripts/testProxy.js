const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const os = require('os');
const path = require('path');

async function testProxy() {
  try {
    const PYTHON_API_URL = 'https://gate-prep-python-ocr.onrender.com';
    
    // Create dummy file in os.tmpdir() like multer does
    const tmpPath = path.join(os.tmpdir(), 'multer_test_file');
    fs.writeFileSync(tmpPath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n');

    const formData = new FormData();
    formData.append('file', fs.createReadStream(tmpPath), {
      filename: 'dummy.pdf',
      contentType: 'application/pdf',
    });

    console.log("Sending to Python API...");
    const response = await axios.post(`${PYTHON_API_URL}/api/pdf/upload`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    console.log("Success:", response.data);
    fs.unlinkSync(tmpPath);
  } catch (error) {
    console.error('Error proxying to Python API:', error.message);
    if (error.response) {
      console.error('Python API Response:', error.response.status, error.response.data);
    }
  }
}

testProxy();
