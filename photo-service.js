// photo-service.js
// logic for working with photo data

// normally, we'd use an http client (e.g. request or axios) to make our 3rd party api requests,
// but for this intentionally minimal api, using the standard library avoids having to install a client.
// a small side-benefit in this case is that https.get() expects "chunked" responses, and continues requests
// until an "end" is reached, which means we don't have to handle pagination
const https = require("https");
// fs allows interacting with file system
const fs = require("fs");


const apiPath = "https://api.nasa.gov/mars-photos/api/v1/rovers/";


// ---------------------------------------------------------------------------------------------------------------
// Description: retrieve photo data from nasa api
// Parameters: date (YYYY-MM-DD): the earth-date for the photos to retrieve
// Returns: array of image urls
// ---------------------------------------------------------------------------------------------------------------
async function fetchData (date) {
  const allRovers = ["curiosity", "opportunity", "spirit"];
  let counter = 0;
  let photoData = [];

  return new Promise((res, rej) => {
    // we want all photos for a given date, but nasa has them divided by rover. retrieve for all rovers
    allRovers.forEach((rover) => {
      https.get(`${apiPath}${rover}/photos?earth_date=${date}&api_key=${process.env.NASA_API_KEY}`, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          let json = JSON.parse(data);
          if (json.error) {
            rej(data);
            return;
          }
          // we only need the image urls
          json.photos.forEach((photo) => {
            photoData.push(photo.img_src);
          });
          counter++;
          if (counter === allRovers.length) {
            res(photoData);
          }
        });
      }).on("error", (err) => {
        console.error("Error: " + err.message);
        rej(err);
      });
    });
  });
}


// ---------------------------------------------------------------------------------------------------------------
// Description: downloads a batch of photos
// Parameters: photoData - an array of photo urls; directory - the save destination
// Returns: count of downloads if successful, else error
// ---------------------------------------------------------------------------------------------------------------
function downloadPhotos (photoData, directory) {

  photoData.forEach((url) =>  {
    https.get(url, (photo) => {
      let imgNameArr = url.split("/");
      let imgName = imgNameArr[imgNameArr.length - 1];
      let filePath = fs.createWriteStream(`${directory}/${imgName}`);
      photo.pipe(filePath);
      filePath.on("finish", () => {
        filePath.close();
      });
      filePath.on("error", (err) => {
        console.error("Error: " + err.message);
      })
    });
  })
}


// ---------------------------------------------------------------------------------------------------------------
// exports
// ---------------------------------------------------------------------------------------------------------------
module.exports = {
  fetchData: fetchData,
  downloadPhotos: downloadPhotos,
}