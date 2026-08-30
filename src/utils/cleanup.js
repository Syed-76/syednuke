import logger from './logger.js';
import { deleteTestChannels, getTestChannels } from './testChannels.js';
import { deleteTestRoles, getTestRoles } from './testRoles.js';

export async function performFullCleanup(guild) {
  const results = {
    startTime: new Date(),
    channels: { success: 0, failed: 0, errors: [] },
    roles: { success: 0, failed: 0, errors: [] },
    totalSuccess: 0,
    totalFailed: 0,
  };

  try {
    logger.info(`Starting SYEDNUKE cleanup on guild: ${guild.name} (${guild.id})`);

    const channelResults = await deleteTestChannels(guild);
    results.channels = channelResults;
    results.totalSuccess += channelResults.success;
    results.totalFailed += channelResults.failed;

    const roleResults = await deleteTestRoles(guild);
    results.roles = roleResults;
    results.totalSuccess += roleResults.success;
    results.totalFailed += roleResults.failed;

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

    logger.info(
      `SYEDNUKE cleanup completed. Success: ${results.totalSuccess}, Failed: ${results.totalFailed}`
    );

    return results;
  } catch (error) {
    logger.error(`Cleanup operation failed: ${error.message}`);
    results.error = error.message;
    return results;
  }
}

export async function getCleanupStats(guild) {
  try {
    const testChannels = await getTestChannels(guild);
    const testRoles = await getTestRoles(guild);

    return {
      channelCount: testChannels.size,
      roleCount: testRoles.size,
      totalTestResources: testChannels.size + testRoles.size,
    };
  } catch (error) {
    logger.error(`Failed to get cleanup stats: ${error.message}`);
    return {
      channelCount: 0,
      roleCount: 0,
      totalTestResources: 0,
      error: error.message,
    };
  }
}
