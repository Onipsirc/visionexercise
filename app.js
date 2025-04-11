var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan'); // Multer logger
const multer = require('multer'); // Add multer
const vision = require('@google-cloud/vision');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Multer config
const storage = multer.memoryStorage();
// .diskStorage({
//   destination: function(req, file, callback) {
//     callback(null, path.join(__dirname, 'uploads')); // Use path.join for correct path handling
//   },
//   filename: function (req, file, callback) {
//     callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Add timestamp and extension for uniqueness
//   }
// });

const upload = multer({ storage: storage });

// POST route for image upload
app.post('/uploadImage', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.log("No file received");

      return res.send({success: false});
    } else {
      console.log('file received');

      const imageBuffer = req.file.buffer;
      const labels = await detectLabels(imageBuffer)

      const imageBase64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype; // e.g. image/jpeg

      const imageSrc = `data:${mimeType};base64,${imageBase64}`;


      return res.send({
        success: true,
        imageSrc: imageSrc,
        labels: labels.map(label => label.description)
      });
    }
  } catch (error) {
    console.log(error);
    res.send({success: false});
  }
});

async function detectLabels(imageBuffer) {
  const client = new vision.ImageAnnotatorClient();
  const imageBase64 = imageBuffer.toString('base64');

  const request = {
    image: { content: imageBase64 },
  };

  const [result] = await client.labelDetection(request);
  return result.labelAnnotations;
}

// App uses
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
