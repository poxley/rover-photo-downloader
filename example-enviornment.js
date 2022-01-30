// environment.js
// normally, we'd put variables in a .env file, and have them set by the dotenv module,
// but for this intentionally minimal api, this strategy avoids having to install dontenv

let set = () => {
  console.log('setting .env variables');
  process.env.PORT = 8080;
  process.env.NASA_API_KEY = "DEMO_KEY";
}

module.exports = {
  set: set,
}
