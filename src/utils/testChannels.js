import config from '../config.js';
import logger from './logger.js';

export async function getTestChannels(guild) {
  try {
    const channels = await guild.channels.fetch();
    return channels.filter(
      (channel) =>
        channel.name &&
        channel.name.startsWith(config.testChannelPrefix)
    );
  } catch (error) {
    logger.error(`Failed to fetch test channels: ${error.message}`);
    return [];
  }
}

export async function deleteTestChannels(guild) {
  const testChannels = await getTestChannels(guild);
  const results = { success: 0, failed: 0, errors: [] };

  for (const channel of testChannels.values()) {
    try {
      await channel.delete();
      results.success++;
      logger.info(`Deleted test channel: ${channel.name}`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        channel: channel.name,
        error: error.message,
      });
      logger.error(
        `Failed to delete channel ${channel.name}: ${error.message}`
      );
    }
  }

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
      });
      results.success++;
      results.channels.push(channel);
      logger.info(`Created test channel: ${channel.name}`);
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
