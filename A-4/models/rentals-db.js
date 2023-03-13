const fs = require("fs");

let rentals = [];

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    fs.readFile("./data/rentals.json", "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        rentals = JSON.parse(data);
        resolve();
      }
    });
  });
};

module.exports.getFeaturedRentals = () => {
  return new Promise((resolve, reject) => {
    const data = rentals.filter((rental) => rental.featuredRental);
    data.length > 0 ? resolve(data) : reject("no results returned");
  });
};

module.exports.getRentalsByCityAndProvince = () => {
  return new Promise((resolve, reject) => {
    const getNewRentals = (arr, key) => {
      return arr.reduce((rv, x) => {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    };
    const data = getNewRentals(rentals, "city");
    resolve(data);
  });
};
