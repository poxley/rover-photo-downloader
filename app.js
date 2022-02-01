// app.js
// app server and routes

const http = require("http");
const environment = require("./environment");
const controller = require("./controller");
environment.set();

const server = http.createServer(async (req, res) => {
  if (req.url.includes("/api/v1/roverphotos") && req.method === "GET") {
    await controller.getRoverPhotos(req, res);
  }
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "404. Not found." }));
  }
});

server.listen(process.env.PORT, () => {
  console.log("Server listening on port " + process.env.PORT);
});
