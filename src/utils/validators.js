import config from '../config.js';

export function validateToken() {
  if (!config.token) {
    throw new Error('DISCORD_TOKEN is not set in .env file');
  }
  if (config.token === 'YOUR_BOT_TOKEN') {
    throw new Error('DISCORD_TOKEN is not configured. Please set it in .env file');
  }
}

export function validateOwnerId() {
  if (!config.ownerId) {
    throw new Error('OWNER_ID is not set in .env file');
  }
  if (config.ownerId === 'YOUR_DISCORD_USER_ID') {
    throw new Error('OWNER_ID is not configured. Please set it in .env file');
  }
}

export function validateInviteUrl() {
  try {
    new URL(config.serverInviteUrl);
    return true;
  } catch (error) {
    return false;
  }
}

export function isValidGuild(guild) {
  return guild && guild.id && guild.name;
}

export function isValidChannel(channel) {
  return channel && channel.id && channel.name;
}

export function isValidRole(role) {
  return role && role.id && role.name;
}
