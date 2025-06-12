const { migrateTagsToTagsArray } = require('./migrate');
const { getPendingCount } =require('./pending')
const logger = require('../logger');
const {connect} = require("../db");

(async () => {
  try {
    await connect();
    const count = await getPendingCount();
    const updated = await migrateTagsToTagsArray(count);
    logger.info(`🎯 Migration completed. Total users updated: ${updated}`);
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Migration failed: ${err.message}`);
    process.exit(1);
  }
})();
