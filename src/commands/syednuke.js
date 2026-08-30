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
const pendingInteractions = new Map();

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
        message: sentMessage,
        startTime: Date.now(),
      });

      logger.logOperation(userId, guildId, 'syednuke', 'CONFIRMATION_SENT', `Awaiting confirmation from user`);

      const collector = sentMessage.createMessageComponentCollector({
        time: config.confirmationTimeout,
      });

      collector.on('collect', async (interaction) => {
        try {
          if (interaction.user.id !== userId) {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content: '❌ This confirmation belongs to another user.',
                ephemeral: true,
              }).catch(() => {});
            }
            return;
          }

          if (interaction.customId === 'syednuke_confirm') {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.deferUpdate().catch(() => {});
            }
            collector.stop();
            executeSyednukeAsync(sentMessage, message.guild, userId, guildId);
          } else if (interaction.customId === 'syednuke_cancel') {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.deferUpdate().catch(() => {});
            }
            collector.stop();
            handleCancel(sentMessage, userId, guildId);
          }
        } catch (error) {
          logger.error(`Collector interaction error: ${error.message}`);
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time' && activeOperations.has(guildId)) {
          handleTimeout(sentMessage, userId, guildId);
        }
      });
    } catch (error) {
      logger.error(`syednuke command error: ${error.message}`);
      logger.logOperation(userId, guildId, 'syednuke', 'ERROR', error.message);
      await message.reply('❌ An error occurred. Check logs for details.').catch(() => {});
    }
  },

  async handleButtonInteraction(interaction) {
    if (interaction.customId === 'syednuke_confirm' || interaction.customId === 'syednuke_cancel') {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.deferUpdate().catch(() => {});
      }
    }
  },
};

async function handleCancel(message, userId, guildId) {
  try {
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('syednuke_confirm')
        .setLabel('✅ CONFIRM RESET')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('syednuke_cancel')
        .setLabel('❌ CANCEL')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    const cancelEmbed = new EmbedBuilder()
      .setColor('#FFAA00')
      .setTitle('🛑 SYEDNUKE CANCELLED')
      .setDescription('SYEDNUKE test reset has been cancelled.')
      .setFooter({ text: `Cancelled by: ${userId}` })
      .setTimestamp();

    await message.edit({
      embeds: [cancelEmbed],
      components: [disabledRow],
    }).catch(() => {});

    logger.logOperation(userId, guildId, 'syednuke', 'CANCELLED', 'User cancelled operation');
    activeOperations.delete(guildId);
  } catch (error) {
    logger.error(`Error handling cancel: ${error.message}`);
  }
}

async function handleTimeout(message, userId, guildId) {
  try {
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('syednuke_confirm')
        .setLabel('✅ CONFIRM RESET')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('syednuke_cancel')
        .setLabel('❌ CANCEL')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    const timeoutEmbed = new EmbedBuilder()
      .setColor('#999999')
      .setTitle('⏰ CONFIRMATION EXPIRED')
      .setDescription('This confirmation has expired. Please run >syednuke again to start a new test.')
      .setFooter({ text: `Initiated by: ${userId}` })
      .setTimestamp();

    await message.edit({
      embeds: [timeoutEmbed],
      components: [disabledRow],
    }).catch(() => {});

    logger.logOperation(userId, guildId, 'syednuke', 'TIMEOUT', 'Confirmation timeout');
    activeOperations.delete(guildId);
  } catch (error) {
    logger.error(`Error handling timeout: ${error.message}`);
  }
}

function executeSyednukeAsync(message, guild, userId, guildId) {
  executeSyednuke(message, guild, userId, guildId).catch((error) => {
    logger.error(`Async execution error: ${error.message}`);
  });
}

async function executeSyednuke(message, guild, userId, guildId) {
  try {
    const statusEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🔄 SYEDNUKE TEST IN PROGRESS')
      .setDescription('Processing your test reset...')
      .setTimestamp();

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('syednuke_confirm')
        .setLabel('✅ CONFIRM RESET')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('syednuke_cancel')
        .setLabel('❌ CANCEL')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await message.edit({
      embeds: [statusEmbed],
      components: [disabledRow],
    }).catch(() => {});

    logger.info(`🔄 Starting SYEDNUKE test...`);

    logger.info(`🧹 Cleaning bot-created test channels and roles...`);

    const cleanupResults = await performFullCleanup(guild);

    logger.info(`🏁 SYEDNUKE TEST COMPLETE`);

    const resultEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🏁 SYEDNUKE TEST COMPLETE')
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

    await message.edit({
      embeds: [resultEmbed],
      components: [disabledRow],
    }).catch(() => {});

    logger.logOperation(userId, guildId, 'syednuke', 'SUCCESS', `Deleted ${cleanupResults.totalSuccess} resources, ${cleanupResults.totalFailed} failed`);
  } catch (error) {
    logger.error(`Error during syednuke execution: ${error.message}`);
    logger.logOperation(userId, guildId, 'syednuke', 'EXECUTION_ERROR', error.message);

    try {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ SYEDNUKE ERROR')
        .setDescription(`An error occurred: ${error.message}`)
        .setFooter({ text: `Executed by: ${userId}` })
        .setTimestamp();

      await message.edit({
        embeds: [errorEmbed],
        components: [],
      }).catch(() => {});
    } catch (editError) {
      logger.error(`Failed to edit error message: ${editError.message}`);
    }
  } finally {
    activeOperations.delete(guildId);
  }
}
