require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { URL } = require('url');

const app = express();

mongoose.connect(process.env.MONGO_URI);

const shortUrlSchema = new mongoose.Schema({
  id: String,
  original_url: String
})

const shortURL = mongoose.model('shortURL', shortUrlSchema);


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


async function generateUniqueID() {
  let uniqueID;
  let isUnique = false;

  do {
      uniqueID = Math.floor(Math.random()*500+1);

      const existingData = await shortURL.findOne({ id: uniqueID });
      if (!existingData) {
          isUnique = true;
      }
  } while (!isUnique);

  return uniqueID;
}

const validateURL = (url) => {
  try {
    const parsedURL = new URL(url);
    return parsedURL.protocol === "http:" || parsedURL.protocol === "https:";
  } catch(err) {
    return false;
  }
}

app.post('/api/shorturl', async (req, res) => {
  if(req.body.url && validateURL(req.body.url)) {
    try {
      const id = await generateUniqueID();
      
      const newShortURL = new shortURL({
        id: id,
        original_url: req.body.url
      });

      newShortURL.save();

      res.json({ original_url: req.body.url, short_url: id});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.json({'error': "Invalid URL"})
  }
})

app.get('/api/shorturl/:id', function(req, res) {
  shortURL.findOne({id: req.params.id})
    .then((data) => {
      if(data) {
        res.redirect(data.original_url);
      } else {
        res.json({'error': 'Invalid ShortURL'});
      }
    })
    .catch(err => {
      console.error(err);
      res.json({'error': 'something went wrong'})
    })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
