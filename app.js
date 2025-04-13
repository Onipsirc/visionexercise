const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const multer = require('multer');
const vision = require('@google-cloud/vision');

const app = express();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Multer in-memory config
const upload = multer({ storage: multer.memoryStorage() });

// Home page with upload form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Image Label Detection</title>
      <style>
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(to right, #00B7FF, #0078D7);
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #333;
        }
        .container {
          background-color: #fff;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          text-align: center;
          width: 100%;
          max-width: 500px;
        }
        h1 {
          margin-bottom: 20px;
          color: #0078D7;
        }
        form {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        input[type="file"] {
          margin-bottom: 20px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          width: 100%;
        }
        input[type="submit"] {
          background-color: #00B7FF;
          border: none;
          color: white;
          padding: 12px 24px;
          font-size: 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        input[type="submit"]:hover {
          background-color: #0078D7;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Upload an Image</h1>
        <form action="/uploadImage" method="POST" enctype="multipart/form-data">
          <input type="file" name="file" accept="image/*" required />
          <input type="submit" value="Analyze Image" />
        </form>
      </div>
    </body>
    </html>
  `);
});

// Upload endpoint
app.post('/uploadImage', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.send({ success: false, message: 'No file uploaded' });
    }

    const imageBuffer = req.file.buffer;
    const labels = await detectLabels(imageBuffer);
    const imageBase64 = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    const imageSrc = `data:${mimeType};base64,${imageBase64}`;

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Results</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f4f4f4;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
          }
          .results {
            background: #fff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
          }
          h1 {
            margin-bottom: 20px;
          }
          img {
            max-width: 100%;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          ul {
            list-style: none;
            padding: 0;
          }
          li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
            font-size: 16px;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            text-decoration: none;
          
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            transition: background-color 0.3s ease;
          }
       
        </style>
      </head>
      <body>
        <div class="results">
          <h1>Detected Labels</h1>
          <img src="${imageSrc}" alt="Uploaded Image" />
          <ul>
            ${labels.map(label => `<li>${label.description} (${(label.score * 100).toFixed(2)}%)</li>`).join('')}
          </ul>
          <a href="/">Upload Another</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
  }
});

// Google Cloud Vision label detection
async function detectLabels(imageBuffer) {
  const client = new vision.ImageAnnotatorClient();
  const request = { image: { content: imageBuffer.toString('base64') } };
  const [result] = await client.labelDetection(request);
  return result.labelAnnotations || [];
}

// 404 and error handling
app.use((req, res, next) => next(createError(404)));
app.use((err, req, res, next) => {
  res.status(err.status || 500).send(`<h1>Error</h1><p>${err.message}</p>`);
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
