const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
let isConnected;

module.exports = connectToDatabase = () => {
  console.log("connection request received");
  if (isConnected) {
    console.log("=> using existing database connection");
    return Promise.resolve();
  }

  console.log("=> using new database connection");
  const client = mongoose
    .connect(process.env.CONNECTIONURL)
    .then((db) => {
      isConnected = db.connections[0].readyState;
    })
    .catch((err) => {
      console.log("-error in db conection-----", err);
      return err;
    });
  console.log("---------client=-------", client);
  return client;
};
