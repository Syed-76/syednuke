import { EmbedBuilder } from 'discord.js';
import config from '../config.js';
import logger from '../utils/logger.js';

export const command = {
  name: 'syedhelp',
  description: 'Display all commands',
  async execute(message) {
    try {
      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📖 SYEDNUKE HELP')
        .setDescription('Complete list of available commands')
        .addFields(
          {
            name: `${config.prefix}syednuke`,
            value:
              'Start the safe test reset (deletes and recreates test resources). Requires confirmation.',
            inline: false,
          },
          {
            name: `${config.prefix}syednukeall`,
            value:
              '🔥 **OWNER ONLY** - Deletes ALL channels and roles. Use with extreme caution!',
            inline: false,
          },
          {
            name: `${config.prefix}syedlink`,
            value:
              'Posts the configured server invite to all bot-created test channels.',
            inline: false,
          },
          {
            name: `${config.prefix}syedstatus`,
            value:
              'Displays bot status, ping, guild info, and test resource counts.',
            inline: false,
          },
          {
            name: `${config.prefix}syedcancel`,
            value: 'Cancels an active SYEDNUKE operation.',
            inline: false,
          },
          {
            name: `${config.prefix}syedhelp`,
            value: 'Displays this help message.',
            inline: false,
          }
        )
        .addFields(
          {
            name: 'Test Resources',
            value:
              'Only bot-created resources with the `syed-test-` prefix are affected by cleanup operations.',
            inline: false,
          },
          {
            name: 'Safety Features',
            value:
              'All operations require confirmation and respect Discord permissions. The bot will never delete @everyone role or existing user roles.',
            inline: false,
          },
          {
            name: 'Configuration',
            value:
              'Setup your .env file with DISCORD_TOKEN, OWNER_ID, and SERVER_INVITE_URL to get started.',
            inline: false,
          }
        )
        .setFooter({ text: 'SYEDNUKE v1.0.0' })
        .setTimestamp();

      logger.logOperation(message.author.id, message.guild.id, 'syedhelp', 'SUCCESS', 'Help requested');
      return message.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`syedhelp command error: ${error.message}`);
      logger.logOperation(message.author.id, message.guild.id, 'syedhelp', 'ERROR', error.message);
      return message.reply('❌ An error occurred. Check logs for details.');
    }
  },
};
