const { connect } = require('../db');
const logger = require('../logger');

(async () => {
  try {
    const db = await connect();
    const usersCollection = db.collection('users_clone');
    
    const notMigrated = await usersCollection.countDocuments({
      tags: { $exists: true },
      tagsArray: { $exists: false },
      externalAppsArray: {
        $elemMatch: { externalAppId: { $exists: true, $ne: null } }
      }
    });
    
    const migrated = await usersCollection.countDocuments({
      tags: { $exists: true },
      tagsArray: { $exists: true },
      externalAppsArray: {
        $elemMatch: { externalAppId: { $exists: true, $ne: null } }
      }
    });
    
    const total = migrated + notMigrated;
    
    logger.info(`📊 Migration Summary:`);
    logger.info(`✅ Migrated: ${migrated}`);
    logger.info(`⏳ Not Migrated: ${notMigrated}`);
    logger.info(`🔢 Total: ${total}`);
    logger.info(`✔️ Migration Complete: ${notMigrated === 0}`);
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Failed to summarize migration: ${err.message}`);
    process.exit(1);
  }
})();
