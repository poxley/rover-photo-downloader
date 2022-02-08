// controller.js
// control, response

// url allows parsing url and query string
const url = require("url");
// fs allows interacting with file system
const fs = require("fs");

const dateService = require("./date-service");
const photoService = require("./photo-service");


// ---------------------------------------------------------------------------------------------------------------
// Description: retrieve data for given date and download any photos found
// Parameters: request/response objects
// Returns: none. completes response
// ---------------------------------------------------------------------------------------------------------------
function respond(res, status, message) {
  const statusMessage = {
    200: "200. Success",
    204: "204. The request was successful, but no matching records were returned.",
    400: "400. Invalid input.",
    404: "404. Not found.",
    500: message,
  }

  let responseMessage = {
    message: statusMessage[status],
  };

  if (status === 200) {
    responseMessage.images_found = message.images_found;
    responseMessage.image_directory = message.image_directory;
    responseMessage.note = "Download process has begun but may take some time to complete."
  }

  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(responseMessage));
}


// ---------------------------------------------------------------------------------------------------------------
// Description: retrieve data for given date and download any photos found
// Parameters: request/response objects
// Returns: none. completes response
// ---------------------------------------------------------------------------------------------------------------
async function getRoverPhotos (req, res) {
  // validate request
  if (!(req.url.includes("/api/v1/roverphotos") && req.method === "GET")) {
    respond(res, 404);
    return;
  }

  // validate date
  const query = url.parse(req.url, true).query;
  const date = new Date(query.earthdate);
  if (!dateService.dateIsValid(date)) {
    respond(res, 400);
    return;
  }

  const formattedDate = dateService.formatDate(date);
  const directory = "./" + formattedDate;

  // if we've already gotten photos for this date - why do it again?
  if (fs.existsSync(directory)) {
    fs.readdir(directory, (err, files) => {
      respond(res, 200, { images_found: files.length, image_directory: directory });
    });
  }
  else {
    try {
      // finally getting around to retrieving data from nasa api
      let photoData = await photoService.fetchData(formattedDate);
      fs.mkdirSync(directory);

      if (photoData.length) {
        try {
          photoService.downloadPhotos(photoData, directory);
          respond(res, 200, { images_found: photoData.length, image_directory: directory });
        }
        catch (err) {
          respond(res, 500, err);
        }

      } else { // no records
        respond(res, 204);
      }
    }
    catch (err) {
      respond(res, 500, err);
    }
  }
}


// ---------------------------------------------------------------------------------------------------------------
// exports
// ---------------------------------------------------------------------------------------------------------------
module.exports = {
  getRoverPhotos: getRoverPhotos,
}
