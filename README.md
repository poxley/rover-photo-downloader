
# rover-photo-downloader

## Peter Oxley - Jan2022

https://github.com/poxley/rover-photo-downloader  
A simple REST app that retrieves NASA Mars Rover images for a given date


## Setup and run

- Requires Node.js. If you don't already have Node.js on your system, please follow the instructions here: https://nodejs.org/
- Use terminal (Command Prompt) to navigate to development directory: `> cd path_to_dev_directory`
- Clone the app repository`> git clone git@github.com:poxley/rover-photo-downloader.git`
- Navigate to app directory `> cd rover-photo-downloader`
- Copy example environment file for use by app `> copy example-environment.js environment.js`
- By default, app uses port 8080 and uses a NASA demo api key. These defaults can be changed by editing the environment.js file
  - The demo api key has a very low rate limit. You can apply for a (free) key with a much higher limit at https://api.nasa.gov/
- Start the app `> node app.js`
- You should now be able to make GET requests to localhost at the port specified in environment.js
  - Sample Postman GET: `localhost:8080/api/v1/roverphotos?earthdate=2022-01-21`


## Using the app

- The app only supports GET requests
- Some options for making requests:
  - Postman calls
  - Browser address bar
- GET call format: `<local_address>:<port>/api/v1/roverphotos?earthdate=<valid_date_string>`
- The app uses dates in YYYY-MM-DD format. Other formats are acceptable if they can be parsed by the JavaScript Date() function
- Example calls:
  - `http://localhost:8080/api/v1/roverphotos?earthdate=2022-01-15`
  - `http://localhost:8080/api/v1/roverphotos?earthdate=Jan16,%202022`
- If NASA Mars Rover images are found for the date requested, they will be downloaded to a directory within the app directory named by date (YYYY-MM-DD)
- The app response includes:
  - an HTTP response code and description or 3rd party error message
  - number of images found/downloaded and the destination directory
- ***!!!!! Please Note: the response is not sent until the download process is complete. If many images are found for a date, this may take some time. Please be patient!***


## Discussion

- Some non-standard decisions were made based on the limited scope of the project and an attempt to keep the codebase small
  - Used Standard Library instead of installing an HTTP Client (like Axios) for 3rd party API calls
  - Used environment.js to set environment variables instead of installing a service like dotenv
- User input is limited, so data validation is minimal
- File System *Sync functions are blocking and generally to be avoided in a production/server environment. They are used here for simplicity and because we do not expect multiple simultaneous operations


## I used the following resources

- HTTP requests without installing a client: https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
- Using fs to save a file: https://www.geeksforgeeks.org/how-to-download-a-file-using-node-js/ (Method 1)
- Appropriate HTTP codes for responses: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes


## Manual tests

1. test: expected api call
   - call to `http://localhost:8080/api/v1/roverphotos?earthdate=2022-01-15`
   - returns `{"message":"200. Success.","images_found":290,"images_downloaded":290,"image_directory":"./2022-01-15"}`
   - manual validation finds 290 image files in directory
   - results as expected
2. test: repeated api call
   - call (2nd) to `http://localhost:8080/api/v1/roverphotos?earthdate=2022-01-15`
   - returns`{"message":"204. Directory already exists.","images_found":0,"images_downloaded":0,"image_directory":"./2022-01-15"}`
   - results as expected
3. test: unexpected date format provided - able to validate
   - call to `http://localhost:8080/api/v1/roverphotos?earthdate=Jan16,%202022`
   - returns `{"message":"200. Success.","images_found":80,"images_downloaded":80,"image_directory":"./2022-01-16"}`
   - manual validation finds 80 image files in directory
   - results as expected
4. test: invalid date format provided
   - call to `http://localhost:8080/api/v1/roverphotos?earthdate=baddate`
   - returns `{"message":"400. Invalid date.","images_found":0,"images_downloaded":0,"image_directory":"na"}`
   - results as expected
5. test: no date provided
   - call to `http://localhost:8080/api/v1/roverphotos`
   - returns `{"message":"400. Invalid date.","images_found":0,"images_downloaded":0,"image_directory":"na"}`
   - results as expected
6. test: bad nasa api key
   - call to `http://localhost:8080/api/v1/roverphotos?earthdate=2022-01-21` with bad key in vars
   - returns `{"message":"{\n  \"error\": {\n    \"code\": \"API_KEY_INVALID\",\n    \"message\": \"An invalid api_key was supplied. Get one at https://api.nasa.gov:443\"\n  }\n}","images_found":0,"images_downloaded":0,"image_directory":"na"}`
   - results as expected
7. test: bad route
   - call to `http://localhost:8080/api/v1/badroute?earthdate=2022-01-21`
   - returns `{"message":"404. Not found."}`
   - results as expected
8. test: date with no photos
   - call to `http://localhost:8080/api/v1/roverphotos?earthdate=1901-01-01`
   - returns `{"message":"204. The request was successful, but no matching records were returned.","images_found":0,"images_downloaded":0,"image_directory":"./1901-01-01"}`
   - results as expected
