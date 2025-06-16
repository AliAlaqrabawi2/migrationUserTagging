const { migrateTagsToTagsArray } = require('./migrate');
const { getPendingCount } =require('./pending')
const logger = require('../logger');
const {connect} = require("../db");

(async () => {
  try {
    await connect();
    await getPendingCount();
    process.exit(0);
  } catch (err) {
    logger.error(`❌${err.message}`);
    process.exit(1);
  }
})();
