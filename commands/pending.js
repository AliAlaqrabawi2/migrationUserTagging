const { connect } = require('../db');
const logger = require('../logger');

(async () => {
  try {
    const db = await connect();
    const usersCollection = db.collection('users_clone');
    
    const count = await usersCollection.countDocuments({
      tags: { $exists: true },
      tagsArray: { $exists: false },
      externalAppsArray: {
        $elemMatch: { externalAppId: { $exists: true, $ne: null } }
      }
    });
    
    logger.error(`🟡 Pending users to migrate: ${count}`);
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Failed to get pending count: ${err.message}`);
    process.exit(1);
  }
})();
