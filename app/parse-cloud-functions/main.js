const logger = require("parse-server").logger;

Parse.Cloud.define("clearOldNames", async request => {
  logger.info("clearOldNames called!");
  const query = new Parse.Query("Device");
  query.exists("name"); // If name is empty we don't care about the device
  const innerQuery = new Parse.Query("User");

  let compareDate = new Date();
  compareDate.setDate(compareDate.getDate() - 60);
  //Now compareDate should be 60 days before now
  innerQuery.lessThan("lastLogin", compareDate);

  query.matchesQuery("owner", innerQuery);
  const devices = await query.find();
  for (let i = 0; i < devices.length; i++) {
    // let dev = devices[i];

    const name = devices[i].get("name");
    logger.info(name);

    devices[i].unset("name");
  }
  try {
    await Parse.Object.saveAll(devices, { useMasterKey: true });
    return "removed " + devices.length + " names";
  } catch (err) {
    return err;
  }
});
