import logger from './logger.js';
import { shouldProtectRole } from './permissions.js';

export async function performFullNuke(guild, userId, guildId) {
  const results = {
    startTime: new Date(),
    channels: { success: 0, failed: 0, errors: [] },
    roles: { success: 0, failed: 0, errors: [] },
    totalSuccess: 0,
    totalFailed: 0,
  };

  try {
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`🔥 STARTING SYEDNUKEALL - FULL SERVER NUKE`);
    logger.info(`Guild: ${guild.name} (${guild.id})`);
    logger.info(`Executed by: ${userId}`);
    logger.info(`Timestamp: ${new Date().toISOString()}`);
    logger.info(`${'='.repeat(60)}\n`);

    logger.info(`📍 PHASE 1: DELETE ALL CHANNELS`);
    logger.info(`Total channels to process: ${guild.channels.cache.size}\n`);

    const channelResults = await deleteAllChannels(guild);
    results.channels = channelResults;
    results.totalSuccess += channelResults.success;
    results.totalFailed += channelResults.failed;

    logger.info(`\n📍 PHASE 2: DELETE ALL ROLES`);
    logger.info(`Total roles to process: ${guild.roles.cache.size}\n`);

    const roleResults = await deleteAllRoles(guild);
    results.roles = roleResults;
    results.totalSuccess += roleResults.success;
    results.totalFailed += roleResults.failed;

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`✅ SYEDNUKEALL COMPLETED`);
    logger.info(`Duration: ${results.duration}ms`);
    logger.info(`Channels Deleted: ${results.channels.success}`);
    logger.info(`Channels Failed: ${results.channels.failed}`);
    logger.info(`Roles Deleted: ${results.roles.success}`);
    logger.info(`Roles Failed: ${results.roles.failed}`);
    logger.info(`Total Success: ${results.totalSuccess}`);
    logger.info(`Total Failed: ${results.totalFailed}`);
    logger.info(`${'='.repeat(60)}\n`);

    return results;
  } catch (error) {
    logger.error(`\n❌ FULL NUKE OPERATION FAILED: ${error.message}\n`);
    results.error = error.message;
    return results;
  }
}

async function deleteAllChannels(guild) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    const channels = guild.channels.cache.filter(channel => {
      // Protect system channels if they exist
      return channel.id !== guild.systemChannelId && channel.id !== guild.rulesChannelId;
    });

    logger.info(`Found ${channels.size} channels to delete (excluding system channels)`);

    for (const [channelId, channel] of channels.entries()) {
      try {
        logger.debug(`Deleting channel: ${channel.name} (${channelId})`);
        await channel.delete();
        results.success++;
        logger.info(`✅ Deleted channel: ${channel.name}`);
      } catch (error) {
        results.failed++;
        const errorMsg = `❌ Failed to delete channel ${channel.name}: ${error.message}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    logger.info(`\nChannel deletion results:`);
    logger.info(`  Success: ${results.success}`);
    logger.info(`  Failed: ${results.failed}`);

    return results;
  } catch (error) {
    logger.error(`Error in deleteAllChannels: ${error.message}`);
    return results;
  }
}

async function deleteAllRoles(guild) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    const roles = guild.roles.cache.filter(role => {
      // Protect @everyone and managed roles
      if (role.name === '@everyone') {
        logger.debug(`Protected role: @everyone (cannot delete)`);
        return false;
      }

      if (shouldProtectRole(role, guild)) {
        logger.debug(`Protected role: ${role.name} (managed or above bot)`);
        return false;
      }

      return true;
    });

    logger.info(`Found ${roles.size} roles to delete (protected: @everyone, managed roles, and roles above bot)`);

    for (const [roleId, role] of roles.entries()) {
      try {
        logger.debug(`Deleting role: ${role.name} (${roleId})`);
        await role.delete();
        results.success++;
        logger.info(`✅ Deleted role: ${role.name}`);
      } catch (error) {
        results.failed++;
        const errorMsg = `❌ Failed to delete role ${role.name}: ${error.message}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    logger.info(`\nRole deletion results:`);
    logger.info(`  Success: ${results.success}`);
    logger.info(`  Failed: ${results.failed}`);

    return results;
  } catch (error) {
    logger.error(`Error in deleteAllRoles: ${error.message}`);
    return results;
  }
}
