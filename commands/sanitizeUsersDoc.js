const logger = require('../logger');
const {connect, getDB} = require("../db");

(async () => {
  await connect();
  
  const db = getDB();
  const usersCollection = db.collection(process.env.COLLECTION_NAME);
  
  try {
    const result = await usersCollection.updateMany(
      { _migrated: { $exists: true } },
      { $unset: { _migrated: "" } }
    );
    
    logger.info(`✅ Removed _migrated from ${result.modifiedCount} users.`);
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Failed to remove _migrated field: ${err.message}`);
    process.exit(1);
  }
})();
