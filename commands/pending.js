const { getDB } = require('../db');
const logger = require('../logger');

async function getPendingCount() {
  try {
    const db =  getDB();
    const usersCollection = db.collection(process.env.COLLECTION_NAME);
    
    const count = await usersCollection.countDocuments({
      tags: { $exists: true },
      tagsArray: { $exists: false },
      externalAppsArray: {
        $elemMatch: { externalAppId: { $exists: true, $ne: null } }
      }
    });
    
    logger.error(`🟡 Total to be migrated is: ${count}`);
    return count;
  } catch (err) {
    logger.error(`❌ Failed to get pending count: ${err.message}`);
    throw err;
  }
}

module.exports = { getPendingCount };
