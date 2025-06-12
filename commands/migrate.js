const { getDB } = require('../db');
const logger = require('../logger');
const fs = require('fs');
const path = require('path');


const BATCH_SIZE = process.env.BATCH_SIZE;

async function migrateTagsToTagsArray(migrationCount) {
  const db = getDB();
  const usersCollection = db.collection(process.env.COLLECTION_NAME);
  
  let totalUpdated = 0;
  let totalSkipped = 0;
  const erroredIds = [];
  const erroredResponses = [];
  
  while (true) {
    let users;
    try {
      users = await usersCollection.find(
          {
            tagsArray: { $exists: false },
            tags: { $exists: true },
            externalAppsArray: {
              $elemMatch: { externalAppId: { $exists: true, $ne: null } }
            },
            _id: { $nin: erroredIds }
          },
          
          {
            projection: {
              username: 1,
              _id: 1,
              tags: 1,
            }
          }
      ).limit(Number(BATCH_SIZE)).toArray();
    } catch (err) {
      logger.error(`❌ Failed to fetch users batch: ${err.stack}`);
      continue;
    }

    if (!users || users.length === 0) break;
    
    const bulkOps = [];

    for (const user of users) {
      const tagsArray = [];
      
      for (const [appId, tagsList] of Object.entries(user.tags)) {
        if (Array.isArray(tagsList)) {
          tagsList.forEach(tag => {
            if (tag && tag.tagName) {
              tagsArray.push({appId, ...tag});
            }
          });
        }
      }
      bulkOps.push({
        updateOne: {
          filter: {_id: user._id},
          update: {$set: {tagsArray}}
        }
      });
    }

    if (bulkOps.length > 0) {
      try {
        await usersCollection.bulkWrite(bulkOps, { ordered: false });
        totalUpdated += bulkOps.length;
        
        const percentage = ((totalUpdated / migrationCount) * 100).toFixed(4);
        logger.info(`✅ Successfully migrated ${totalUpdated}/${migrationCount} (${percentage}%)`);
      } catch (bulkErr) {
        if (bulkErr && bulkErr.writeErrors) {
          for (const writeError of bulkErr.writeErrors) {
            const failedIndex = writeError.index;
            const failedOp = bulkOps[failedIndex];
            erroredIds.push(failedOp.updateOne.filter._id);
            erroredResponses.push(writeError.errmsg);
          }
        } else {
          bulkOps.forEach(op => {
            erroredIds.push(op.updateOne.filter._id);
          });
        }
        
        totalSkipped += erroredIds.length;
        totalUpdated += bulkOps.length - erroredIds.length;
        const errorData = {
          errored_ids: erroredIds,
          errored_responses: erroredResponses
        };
        logger.error(`❌ Bulk write failed for ${erroredIds.length} users: ${bulkErr.stack}`);
        
        const filePath = path.join(__dirname, 'error_userIDs.json');
          fs.writeFileSync(filePath, JSON.stringify(errorData, null, 2), 'utf-8');
        
      }
    }
  }
  
  const errorPercentage = ((totalSkipped / migrationCount) * 100).toFixed(4);
  logger.info(`🎯 Migration complete. Successfully migrated ${totalUpdated}/${migrationCount} (${((totalUpdated / migrationCount) * 100).toFixed(4)}%)`);
  logger.info(`Errored for ${totalSkipped}/${migrationCount} (${errorPercentage}%)`);
  
  return totalUpdated;
}

module.exports = {
  migrateTagsToTagsArray
};
