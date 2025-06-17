const logger = require('../logger');
const {connect, getDB} = require("../db");

(async ()=>{
  await connect();
  
  const db = getDB();
  const usersCollection = db.collection(process.env.COLLECTION_NAME);
  let totalModified = 0;
  
  while (true) {
    const result = await usersCollection.updateMany(
      { _migrated: { $exists: true } },
      { $unset: { _migrated: "" } },
      { limit: process.env.BATCH_SIZE }
    );
    
    if (result.modifiedCount === 0) break;
    totalModified += result.modifiedCount;
    logger.info(`✅ Removed _migrated from ${result.modifiedCount} users... Total: ${totalModified}`);
    
  }
  
  logger.info(`🎉 Done! Total users updated: ${totalModified}`);
})()

