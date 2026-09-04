import config from '../config.js';
import logger from '../utils/logger.js';
import { isOwnerUser } from '../utils/validators.js';

export const command = {
  name: 'syedkickall',
  description: 'Kick all kickable members in test mode after confirmation',
  async execute(message) {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }

    if (!config.memberTestMode || !isOwnerUser(message.author.id)) {
      return message.reply('❌ This command is available only to an owner while MEMBER_TEST_MODE=true.');
    }

    await message.guild.members.fetch();

    const members = message.guild.members.cache.filter((member) =>
      member.id !== message.guild.ownerId &&
      member.id !== message.client.user.id &&
      member.kickable
    );

    if (members.size === 0) {
      return message.reply('❌ No kickable members were found.');
    }

    const confirmation = await message.reply(
      `⚠️ This will kick **${members.size}** members. Confirm with \`${config.prefix}syedkickall confirm\` within 30 seconds.`
    );

    const collected = await message.channel.awaitMessages({
      filter: (response) => response.author.id === message.author.id,
      max: 1,
      time: 30000,
      errors: ['time'],
    }).catch(() => null);

    const response = collected?.first();
    if (!response || response.content.trim().toLowerCase() !== `${config.prefix}syedkickall confirm`) {
      return confirmation.edit('❌ Kick-all cancelled.');
    }

    let kicked = 0;
    let failed = 0;

    for (const member of members.values()) {
      try {
        await member.kick(`Kick-all requested by ${message.author.tag}`);
        kicked += 1;
      } catch (error) {
        failed += 1;
        logger.error(`Failed to kick ${member.user.tag}: ${error.message}`);
      }
    }

    logger.logOperation(
      message.author.id,
      message.guild.id,
      'syedkickall',
      'COMPLETE',
      `Kicked ${kicked} members; ${failed} failed`
    );

    return confirmation.edit(`✅ Kick-all complete: kicked **${kicked}**, failed **${failed}**.`);
  },
};
