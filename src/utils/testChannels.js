import { PermissionFlagsBits } from 'discord.js';
import config from '../config.js';
import logger from './logger.js';

export async function getTestChannels(guild) {
  try {
    const allChannels = await guild.channels.fetch();
    logger.debug(`📊 Total channels in guild: ${allChannels.size}`);
    
    const testChannels = allChannels.filter((channel) => {
      const isTestChannel =
        channel.name && channel.name.startsWith(config.testChannelPrefix);
      
      if (isTestChannel) {
        logger.debug(`  ✅ Found test channel: "${channel.name}" (ID: ${channel.id})`);
      }
      return isTestChannel;
    });
    
    logger.info(`🔍 Test channel detection: Found ${testChannels.size} channels matching prefix "${config.testChannelPrefix}"`);
    return testChannels;
  } catch (error) {
    logger.error(`Failed to fetch test channels: ${error.message}`);
    return new Map();
  }
}

export async function deleteTestChannels(guild) {
  const testChannels = await getTestChannels(guild);
  const results = { success: 0, failed: 0, errors: [] };

  if (testChannels.size === 0) {
    logger.info(`📋 No test channels to delete (prefix: "${config.testChannelPrefix}")`);
    return results;
  }

  logger.info(`🗑️ Attempting to delete ${testChannels.size} test channel(s)...`);

  for (const [channelId, channel] of testChannels) {
    try {
      logger.info(`  🗑️ Deleting channel: "${channel.name}" (ID: ${channelId})`);
      await channel.delete();
      results.success++;
      logger.info(`  ✅ Successfully deleted: "${channel.name}"`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        channel: channel.name,
        channelId: channelId,
        error: error.message,
      });
      logger.error(`  ❌ Failed to delete "${channel.name}" (${channelId}): ${error.message}`);
    }
  }

  logger.info(`📊 Channel deletion complete: ${results.success} deleted, ${results.failed} failed`);
  return results;
}

export async function createTestChannels(guild, count) {
  const results = { success: 0, failed: 0, errors: [], channels: [] };

  for (let i = 1; i <= count; i++) {
    try {
      const channelName = `${config.testChannelPrefix}${String(i).padStart(
        3,
        '0'
      )}`;
      const channel = await guild.channels.create({
        name: channelName,
        type: 0,
        reason: 'SYEDNUKE Test Channel',
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.MentionEveryone,
            ],
          },
        ],
      });
      results.success++;
      results.channels.push(channel);
      logger.info(`Created test channel: ${channel.name} with @everyone/@here mentions enabled`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        channelNumber: i,
        error: error.message,
      });
      logger.error(
        `Failed to create channel syed-test-${String(i).padStart(
          3,
          '0'
        )}: ${error.message}`
      );
    }
  }

  return results;
}

export function getTestChannelCount(guild, channels) {
  return channels.filter(
    (channel) =>
      channel.name && channel.name.startsWith(config.testChannelPrefix)
  ).length;
}
