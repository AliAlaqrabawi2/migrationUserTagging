const { getDB } = require('./db');
const logger = require('./logger');

const BATCH_SIZE = 1000;

async function migrateTagsToTagsArray() {
  const db = getDB();
  const usersCollection = db.collection('users_clone');
  
  let totalUpdated = 0;
  let totalSkipped = 0;
  
  while (true) {
    let users;
    try {
      users = await usersCollection.find(
          {
            tagsArray: { $exists: false },
            tags: { $exists: true },
            externalAppsArray: {
              $elemMatch: { externalAppId: { $exists: true, $ne: null } }
            }
          },
          {
            projection: {
              _id: 1,
              tags: 1,
            }
          }
      ).limit(BATCH_SIZE).toArray();
    } catch (err) {
      logger.error(`❌ Failed to fetch users batch: ${err.stack}`);
      continue;
    }
    
    if (!users || users.length === 0) break;
    
    const bulkOps = [];
    
    for (const user of users) {
        const tagsArray = [];
        
        for (const [appId, tagsList] of Object.entries(user.tags || {})) {
          if (Array.isArray(tagsList)) {
            tagsList.forEach(tag => {
              if (tag && tag.tagName) {
                tagsArray.push({ appId, ...tag });
              }
            });
          }
        }
        
        bulkOps.push({
          updateOne: {
            filter: { _id: user._id },
            update: { $set: { tagsArray } }
          }
        });
    }
    
    if (bulkOps.length > 0) {
      try {
        await usersCollection.bulkWrite(bulkOps, { ordered: false });
        totalUpdated += bulkOps.length;
        logger.info(`✅ Updated ${bulkOps.length} users (Total updated: ${totalUpdated})`);
      } catch (bulkErr) {
        totalSkipped += bulkOps.length;
        logger.error(`❌ Bulk write failed for batch of ${bulkOps.length} users: ${bulkErr.stack}`);
      }
    }

  }
  
  logger.info(`🎯 Migration complete. Total updated: ${totalUpdated}, Total skipped: ${totalSkipped}`);
  return totalUpdated;
}

module.exports = {
  migrateTagsToTagsArray
};
