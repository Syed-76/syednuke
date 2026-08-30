import { EmbedBuilder } from 'discord.js';
import config from '../config.js';
import logger from '../utils/logger.js';
import { getCleanupStats } from '../utils/cleanup.js';

export const command = {
  name: 'syedstatus',
  description: 'Display bot status',
  async execute(message) {
    try {
      const stats = await getCleanupStats(message.guild);
      const botMember = message.guild.members.me;
      const ping = message.client.ws.ping;

      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📊 SYEDNUKE BOT STATUS')
        .addFields(
          { name: 'Bot Status', value: '✅ Online', inline: true },
          { name: 'Ping', value: `${ping}ms`, inline: true },
          { name: 'Guild', value: message.guild.name, inline: true },
          { name: 'Guild ID', value: message.guild.id, inline: false },
          {
            name: 'Test Channels',
            value: `${stats.channelCount}`,
            inline: true,
          },
          { name: 'Test Roles', value: `${stats.roleCount}`, inline: true },
          {
            name: 'Total Resources',
            value: `${stats.totalTestResources}`,
            inline: true,
          },
          {
            name: 'Member Test Mode',
            value: config.memberTestMode ? '✅ Enabled' : '❌ Disabled',
            inline: true,
          },
          {
            name: 'Invite Configured',
            value: config.serverInviteUrl ? '✅ Yes' : '❌ No',
            inline: true,
          },
          {
            name: 'Max Test Channels',
            value: `${config.maxTestChannels}`,
            inline: true,
          }
        )
        .setFooter({
          text: `Bot version 1.0.0 | Prefix: ${config.prefix}`,
        })
        .setTimestamp();

      logger.logOperation(message.author.id, message.guild.id, 'syedstatus', 'SUCCESS', `Status requested`);
      return message.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`syedstatus command error: ${error.message}`);
      logger.logOperation(message.author.id, message.guild.id, 'syedstatus', 'ERROR', error.message);
      return message.reply('❌ An error occurred. Check logs for details.');
    }
  },
};
