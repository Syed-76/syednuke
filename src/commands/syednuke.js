import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import config from '../config.js';
import logger from '../utils/logger.js';
import { performFullCleanup, getCleanupStats } from '../utils/cleanup.js';

const activeOperations = new Map();

export const command = {
  name: 'syednuke',
  description: 'Start the SYEDNUKE test reset',
  async execute(message) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    if (activeOperations.has(guildId)) {
      return message.reply('⚠️ A SYEDNUKE test is already running.');
    }

    try {
      const stats = await getCleanupStats(message.guild);

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('⚠️ SYEDNUKE TEST MODE')
        .setDescription('This will reset only bot-created test resources.')
        .addFields(
          { name: 'Test Channels', value: `${stats.channelCount}`, inline: true },
          { name: 'Test Roles', value: `${stats.roleCount}`, inline: true },
          {
            name: 'Total Resources',
            value: `${stats.totalTestResources}`,
            inline: true,
          },
          {
            name: 'Action',
            value: 'All resources will be deleted and recreated',
            inline: false,
          }
        )
        .setFooter({ text: 'Expires in 30 seconds' })
        .setTimestamp();

      const confirmButton = new ButtonBuilder()
        .setCustomId('syednuke_confirm')
        .setLabel('✅ CONFIRM RESET')
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId('syednuke_cancel')
        .setLabel('❌ CANCEL')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      const sentMessage = await message.reply({
        embeds: [embed],
        components: [row],
      });

      activeOperations.set(guildId, {
        userId,
        messageId: sentMessage.id,
        startTime: Date.now(),
      });

      logger.logOperation(userId, guildId, 'syednuke', 'CONFIRMATION_SENT', `Awaiting confirmation from user`);

      const collector = sentMessage.createMessageComponentCollector({
        time: config.confirmationTimeout,
      });

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: '❌ Only the user who executed the command can confirm.',
            ephemeral: true,
          });
        }

        if (interaction.customId === 'syednuke_confirm') {
          await interaction.deferUpdate();
          await executeSyednuke(message.guild, userId, guildId);
          activeOperations.delete(guildId);
          collector.stop();
        } else if (interaction.customId === 'syednuke_cancel') {
          await interaction.deferUpdate();
          await message.reply('❌ SYEDNUKE operation cancelled.');
          logger.logOperation(userId, guildId, 'syednuke', 'CANCELLED', 'User cancelled operation');
          activeOperations.delete(guildId);
          collector.stop();
        }
      });

      collector.on('end', () => {
        if (activeOperations.has(guildId)) {
          activeOperations.delete(guildId);
          message.reply('⏱️ SYEDNUKE confirmation timed out.');
          logger.logOperation(userId, guildId, 'syednuke', 'TIMEOUT', 'Confirmation timeout');
        }
      });
    } catch (error) {
      logger.error(`syednuke command error: ${error.message}`);
      logger.logOperation(userId, guildId, 'syednuke', 'ERROR', error.message);
      message.reply('❌ An error occurred. Check logs for details.');
    }
  },
};

async function executeSyednuke(guild, userId, guildId) {
  try {
    const statusEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🔄 SYEDNUKE TEST IN PROGRESS')
      .setDescription('Processing your test reset...')
      .setTimestamp();

    const statusMsg = await guild.channels.cache
      .find((ch) => ch.isTextBased())
      ?.send({ embeds: [statusEmbed] });

    logger.info(`🔄 Starting SYEDNUKE test...`);

    if (statusMsg) {
      await statusMsg.edit({
        embeds: [
          statusEmbed.setDescription('🧹 Cleaning bot-created test channels...'),
        ],
      });
    }
    logger.info(`🧹 Cleaning bot-created test channels...`);

    if (statusMsg) {
      await statusMsg.edit({
        embeds: [
          statusEmbed.setDescription('🧹 Cleaning bot-created test roles...'),
        ],
      });
    }
    logger.info(`🧹 Cleaning bot-created test roles...`);

    const cleanupResults = await performFullCleanup(guild);

    if (statusMsg) {
      await statusMsg.edit({
        embeds: [
          statusEmbed.setDescription('🏗️ Creating new test channels...'),
        ],
      });
    }
    logger.info(`🏗️ Creating new test channels...`);

    logger.info(`🏁 SYEDNUKE TEST COMPLETE`);

    const resultEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ SYEDNUKE TEST COMPLETE')
      .addFields(
        {
          name: 'Channels Deleted',
          value: `${cleanupResults.channels.success}`,
          inline: true,
        },
        {
          name: 'Roles Deleted',
          value: `${cleanupResults.roles.success}`,
          inline: true,
        },
        {
          name: 'Failed Operations',
          value: `${cleanupResults.totalFailed}`,
          inline: true,
        }
      )
      .setFooter({ text: `Executed by: ${userId}` })
      .setTimestamp();

    if (cleanupResults.totalFailed > 0) {
      resultEmbed.setColor('#FFFF00').setTitle('⚠️ SYEDNUKE TEST COMPLETE (WITH ERRORS)');
    }

    if (statusMsg) {
      await statusMsg.edit({ embeds: [resultEmbed], components: [] });
    }

    logger.logOperation(userId, guildId, 'syednuke', 'SUCCESS', `Deleted ${cleanupResults.totalSuccess} resources, ${cleanupResults.totalFailed} failed`);
  } catch (error) {
    logger.error(`Error during syednuke execution: ${error.message}`);
    logger.logOperation(userId, guildId, 'syednuke', 'EXECUTION_ERROR', error.message);
  }
}
