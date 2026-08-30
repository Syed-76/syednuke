import config from '../config.js';

export function getOwnerIds() {
  const ownerIds = config.ownerIds && config.ownerIds.length > 0
    ? config.ownerIds
    : config.ownerId
      ? [config.ownerId]
      : [];

  return ownerIds.filter((id) => id && id !== 'YOUR_DISCORD_USER_ID');
}

export function isOwnerUser(userId) {
  if (!userId) {
    return false;
  }

  const ownerIds = getOwnerIds();
  return ownerIds.includes(String(userId));
}

export function validateToken() {
  if (!config.token) {
    throw new Error('DISCORD_TOKEN is not set in .env file');
  }
  if (config.token === 'YOUR_BOT_TOKEN') {
    throw new Error('DISCORD_TOKEN is not configured. Please set it in .env file');
  }
}

export function validateOwnerId() {
  const ownerIds = getOwnerIds();

  if (ownerIds.length === 0) {
    throw new Error('OWNER_ID or OWNER_IDS is not set in .env file');
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
