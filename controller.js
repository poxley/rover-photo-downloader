// controller.js
// functionality of the api

// normally, we'd use an http client (e.g. request or axios) to make our 3rd party api requests,
// but for this intentionally minimal api, using the standard library avoids having to install a client.
// a small side-benefit in this case is that https.get() expects "chunked" responses, and continues requests
// until an "end" is reached, which means we don't have to handle pagination
const https = require("https");
// for parsing url and query string
const url = require("url");
// for interacting with file system
const fs = require("fs");


// ---------------------------------------------------------------------------------------------------------------
// Description: format date string to our spec
// Parameters: date - a javascript date object
// Returns: a date string formatted for nasa api and our directory naming (YYYY-MM-DD)
// ---------------------------------------------------------------------------------------------------------------
function formatDate(date) {
  let YYYY = date.getUTCFullYear().toString();
  let mm = date.getUTCMonth() + 1;
  let dd = date.getUTCDate();
  let MM = mm < 10 ? "0" + mm.toString() : mm.toString();
  let DD = dd < 10 ? "0" + dd.toString() : dd.toString();
  return (YYYY + "-" + MM + "-" + DD);
}


// ---------------------------------------------------------------------------------------------------------------
// Description: retrieve photo data from nasa api
// Parameters: date (YYYY-MM-DD): the earth-date for the photos to retrieve
// Returns: array of image urls
// ---------------------------------------------------------------------------------------------------------------
async function fetchData (date) {
  let allRovers = ["curiosity", "opportunity", "spirit"];
  let counter = 0;
  let photoData = [];
  let urlString = "https://api.nasa.gov/mars-photos/api/v1/rovers/";
  let queryString = "/photos?earth_date=";
  let apiKeyString = "&api_key=" + process.env.NASA_API_KEY;

  return new Promise((res, rej) => {
    // we want all photos for a given date, but nasa has them divided by rover. retrieve for all rovers
    for (let i = 0; i < allRovers.length; i++) {
      let promise = new Promise((resolve, reject) => {
        // get photo data for this rover
        https.get(urlString + allRovers[i] + queryString + date + apiKeyString, (resp) => {
          let data = '';
          resp.on('data', (chunk) => {
            data += chunk;
          });
          resp.on('end', () => {
            resolve(data);
          });
        }).on("error", (err) => {
          console.error("Error: " + err.message);
          reject(err);
        });
      });

      // add photo data to array or handle error
      promise.then((response) => {
        let json = JSON.parse(response);
        if (json.error) {
          rej(response);
          return;
        }
        // we only need the image urls
        for (let j = 0; j < json.photos.length; j++) {
          photoData.push(json.photos[j].img_src);
        }
        counter++;
        if (counter === allRovers.length) {
          res(photoData);
        }
      });
    }
  });
}


// ---------------------------------------------------------------------------------------------------------------
// Description: downloads a batch of photos
// Parameters: photoData - an array of photo urls; directory - the save destination
// Returns: count of downloads if successful, else error
// ---------------------------------------------------------------------------------------------------------------
async function downloadPhotos (photoData, directory) {
  let downloadCount = 0;
  return new Promise((resolve, reject) => {
    for (let i = 0; i < photoData.length; i++) {
      https.get(photoData[i], (photo) => {
        let imgNameArr = photoData[i].split("/");
        let imgName = imgNameArr[imgNameArr.length - 1];
        let path = directory + "/" + imgName;
        let filePath = fs.createWriteStream(path);
        photo.pipe(filePath);
        filePath.on("finish", () => {
          filePath.close();
          downloadCount++;
          if (downloadCount === photoData.length) {
            resolve(downloadCount);
          }
        });
        filePath.on("error", (err) => {
          console.error("Error: " + err.message);
          reject(err);
        })
      });
    }
  })
}


// ---------------------------------------------------------------------------------------------------------------
// Description: retrieve data for given date and download any photos found
// Parameters: request/response objects
// Returns: none. completes response
// ---------------------------------------------------------------------------------------------------------------
async function getRoverPhotos (req, res) {
  let query = url.parse(req.url, true).query;
  let date = new Date(query.earthdate);
  let formattedDate = '';
  let directory = '';
  let resMessage = {
    message: '',
    images_found: 0,
    images_downloaded: 0,
    image_directory: 'na',
  }

  // try to handle various date formats. if we can't, send error
  if (date.toString() === "Invalid Date") {
    resMessage.message = "400. Invalid date.";
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify(resMessage));
    return;
  }
  else {
    formattedDate = formatDate(date);
    // normally we'd sanitize user input, but we've already basically done that with validation and formatting
    directory = "./" + formattedDate;
  }

  // *Sync functions are blocking, but should be okay for simple, local operations
  if (fs.existsSync(directory)) {
    // we've already gotten photos for this date - why do it again?
    resMessage.message = "204. Directory already exists.";
    resMessage.image_directory = directory;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(resMessage));
  }
  else {
    try {
      // finally getting around to retrieving data from nasa api
      let photoData = await fetchData(formattedDate)

      // we've already determined this directory doesn't exist. create it. we'll do this even if we don't retrieve
      // any photo data so that we have a record of the attempt
      fs.mkdirSync(directory);

      if (photoData.length) {
        try {
          let downloadResult = await downloadPhotos(photoData, directory);

          resMessage.message = "200. Success.";
          resMessage.images_found = photoData.length;
          resMessage.images_downloaded = downloadResult;
          resMessage.image_directory = directory;
          res.writeHead(200, {"Content-Type": "application/json"});
          res.end(JSON.stringify(resMessage));
        }
        catch (err) {
          resMessage.message = err;
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify(resMessage));
        }

      } else {
        resMessage.message = "204. The request was successful, but no matching records were returned.";
        resMessage.image_directory = directory;
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(resMessage));
      }
    }
    catch (err) {
      resMessage.message = err;
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(resMessage));
    }
  }
}


// ---------------------------------------------------------------------------------------------------------------
// exports
// ---------------------------------------------------------------------------------------------------------------
module.exports = {
  getRoverPhotos: getRoverPhotos,
}
