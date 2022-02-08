// app.js
// app server and routes

const http = require("http");
const environment = require("./environment");
const controller = require("./controller");
environment.set();

const server = http.createServer(async (req, res) => {
  await controller.getRoverPhotos(req, res);
});

server.listen(process.env.PORT, () => {
  console.log("Server listening on port " + process.env.PORT);
});
