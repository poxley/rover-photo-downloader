// date-service.js
// logic for working with date data

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
  return (`${YYYY}-${MM}-${DD}`);
}


// ---------------------------------------------------------------------------------------------------------------
// Description: determine if a string can be parsed by javascript Date()
// Parameters: date - a javascript date object
// Returns: boolean
// ---------------------------------------------------------------------------------------------------------------
function dateIsValid(date) {
  return (date.toString() !== "Invalid Date");
}


// ---------------------------------------------------------------------------------------------------------------
// exports
// ---------------------------------------------------------------------------------------------------------------
module.exports = {
  formatDate: formatDate,
  dateIsValid: dateIsValid,
}