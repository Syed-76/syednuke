import logger from './logger.js';
import { deleteTestChannels, getTestChannels, createTestChannels } from './testChannels.js';
import { deleteTestRoles, getTestRoles, createTestRoles } from './testRoles.js';
import config from '../config.js';

export async function performFullCleanup(guild) {
  const results = {
    startTime: new Date(),
    channels: { success: 0, failed: 0, errors: [] },
    channelsCreated: { success: 0, failed: 0, errors: [] },
    roles: { success: 0, failed: 0, errors: [] },
    rolesCreated: { success: 0, failed: 0, errors: [] },
    totalSuccess: 0,
    totalFailed: 0,
  };

  try {
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`🚀 STARTING SYEDNUKE CLEANUP`);
    logger.info(`Guild: ${guild.name} (${guild.id})`);
    logger.info(`Timestamp: ${new Date().toISOString()}`);
    logger.info(`${'='.repeat(60)}\n`);

    logger.info(`📍 PHASE 1: CLEANUP EXISTING TEST RESOURCES`);
    logger.info(`Looking for resources with prefix: "${config.testChannelPrefix}" and "${config.testRolePrefix}"\n`);

    const channelResults = await deleteTestChannels(guild);
    results.channels = channelResults;
    results.totalSuccess += channelResults.success;
    results.totalFailed += channelResults.failed;

    const roleResults = await deleteTestRoles(guild);
    results.roles = roleResults;
    results.totalSuccess += roleResults.success;
    results.totalFailed += roleResults.failed;

    logger.info(`\n📍 PHASE 2: RECREATING TEST RESOURCES`);
    logger.info(`Creating ${config.maxTestChannels} test channels and ${config.maxTestRoles} test roles...\n`);

    const channelsCreated = await createTestChannels(guild, config.maxTestChannels);
    results.channelsCreated = channelsCreated;
    results.totalSuccess += channelsCreated.success;
    results.totalFailed += channelsCreated.failed;

    const rolesCreated = await createTestRoles(guild, config.maxTestRoles);
    results.rolesCreated = rolesCreated;
    results.totalSuccess += rolesCreated.success;
    results.totalFailed += rolesCreated.failed;

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`✅ SYEDNUKE CLEANUP COMPLETED`);
    logger.info(`Duration: ${results.duration}ms`);
    logger.info(`Total Success: ${results.totalSuccess}`);
    logger.info(`Total Failed: ${results.totalFailed}`);
    logger.info(`${'='.repeat(60)}\n`);

    return results;
  } catch (error) {
    logger.error(`\n❌ CLEANUP OPERATION FAILED: ${error.message}\n`);
    results.error = error.message;
    return results;
  }
}

export async function getCleanupStats(guild) {
  try {
    logger.debug(`\n📋 Scanning for existing test resources...`);
    const testChannels = await getTestChannels(guild);
    const testRoles = await getTestRoles(guild);

    const stats = {
      channelCount: testChannels.size,
      roleCount: testRoles.size,
      totalTestResources: testChannels.size + testRoles.size,
    };

    logger.debug(`📋 Stats: ${stats.channelCount} channels, ${stats.roleCount} roles, Total: ${stats.totalTestResources}\n`);
    return stats;
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
