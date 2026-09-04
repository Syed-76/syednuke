import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import config from '../config.js';
import logger from '../utils/logger.js';
import { performFullCleanup } from '../utils/cleanup.js';

const activeOperations = new Map();

export const command = {
  name: 'syednukeall',
  description: '⚠️ DANGER: Delete ALL channels and roles in the server',
  async execute(message) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    const allowedOwnerIds = new Set(
      (config.ownerIds && config.ownerIds.length > 0 ? config.ownerIds : config.ownerId ? [config.ownerId] : [])
        .filter(Boolean)
    );

    if (!allowedOwnerIds.has(userId)) {
      return message.reply('❌ Only the bot owner can execute this command.');
    }

    if (activeOperations.has(guildId)) {
      return message.reply('⚠️ A SYEDNUKEALL operation is already running.');
    }

    try {
      const totalChannels = message.guild.channels.cache.size;
      const totalRoles = message.guild.roles.cache.size;

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🔥 CRITICAL: SYEDNUKE ALL')
        .setDescription('**THIS WILL DELETE ALL CHANNELS AND ROLES**\n\n⚠️ **This action is irreversible!** ⚠️')
        .addFields(
          { name: '💥 Total Channels to Delete', value: `${totalChannels}`, inline: true },
          { name: '💥 Total Roles to Delete', value: `${totalRoles}`, inline: true },
          {
            name: '⚠️ WARNING',
            value: 'This will permanently remove:\n• All text channels\n• All voice channels\n• All categories\n• All roles (except @everyone and managed roles)\n\n**There is no undo!**',
            inline: false,
          },
          {
            name: 'Confirmation Required',
            value: 'Click CONFIRM to proceed. You have 60 seconds.',
            inline: false,
          }
        )
        .setColor('#FF0000')
        .setFooter({ text: '🔥 EXTREME CAUTION - Owner Only' })
        .setTimestamp();

      const confirmButton = new ButtonBuilder()
        .setCustomId('syednukeall_confirm')
        .setLabel('🔥 I UNDERSTAND - DELETE ALL')
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId('syednukeall_cancel')
        .setLabel('❌ CANCEL - DO NOT DELETE')
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

      logger.logOperation(userId, guildId, 'syednukeall', 'CONFIRMATION_SENT', `Awaiting confirmation from owner for full nuke`);

      const collector = sentMessage.createMessageComponentCollector({
        time: 60000, // 60 seconds for critical operation
      });

      collector.on('collect', async (interaction) => {
        try {
          if (interaction.user.id !== userId) {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content: '❌ Only the owner can confirm this operation.',
                ephemeral: true,
              }).catch(() => {});
            }
            return;
          }

          if (interaction.customId === 'syednukeall_confirm') {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.deferUpdate().catch(() => {});
            }
            collector.stop();
            executeSyednukeallAsync(sentMessage, message.guild, userId, guildId);
          } else if (interaction.customId === 'syednukeall_cancel') {
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
      logger.error(`syednukeall command error: ${error.message}`);
      logger.logOperation(userId, guildId, 'syednukeall', 'ERROR', error.message);
      await message.reply('❌ An error occurred. Check logs for details.').catch(() => {});
    }
  },

  async handleButtonInteraction(interaction) {
    if (interaction.customId === 'syednukeall_confirm' || interaction.customId === 'syednukeall_cancel') {
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
        .setCustomId('syednukeall_confirm')
        .setLabel('🔥 I UNDERSTAND - DELETE ALL')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('syednukeall_cancel')
        .setLabel('❌ CANCEL - DO NOT DELETE')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    const cancelEmbed = new EmbedBuilder()
      .setColor('#FFAA00')
      .setTitle('🛑 SYEDNUKEALL CANCELLED')
      .setDescription('Full server nuke has been cancelled.')
      .setFooter({ text: `Cancelled by: ${userId}` })
      .setTimestamp();

    await message.edit({
      embeds: [cancelEmbed],
      components: [disabledRow],
    }).catch(() => {});

    logger.logOperation(userId, guildId, 'syednukeall', 'CANCELLED', 'Operation cancelled by owner');
    activeOperations.delete(guildId);
  } catch (error) {
    logger.error(`Cancel handler error: ${error.message}`);
  }
}

async function handleTimeout(message, userId, guildId) {
  try {
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('syednukeall_confirm')
        .setLabel('🔥 I UNDERSTAND - DELETE ALL')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('syednukeall_cancel')
        .setLabel('❌ CANCEL - DO NOT DELETE')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    const timeoutEmbed = new EmbedBuilder()
      .setColor('#FFAA00')
      .setTitle('⏱️ SYEDNUKEALL TIMEOUT')
      .setDescription('Confirmation expired. Operation cancelled.')
      .setFooter({ text: 'Timed out after 60 seconds' })
      .setTimestamp();

    await message.edit({
      embeds: [timeoutEmbed],
      components: [disabledRow],
    }).catch(() => {});

    logger.logOperation(userId, guildId, 'syednukeall', 'TIMEOUT', 'Confirmation timeout');
    activeOperations.delete(guildId);
  } catch (error) {
    logger.error(`Timeout handler error: ${error.message}`);
  }
}

async function executeSyednukeallAsync(message, guild, userId, guildId) {
  // Fire and forget - do not await
  performFullCleanup(guild)
    .then(async (results) => {
      try {
        const resultEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🔥 SYEDNUKEALL COMPLETE')
          .setDescription('Full server nuke operation completed.')
          .addFields(
            { name: 'Channels Deleted', value: `${results.channels.success}`, inline: true },
            { name: 'Channels Failed', value: `${results.channels.failed}`, inline: true },
            { name: 'Channels Created', value: `${results.channelsCreated.success}`, inline: true },
            { name: 'Roles Deleted', value: `${results.roles.success}`, inline: true },
            { name: 'Roles Failed', value: `${results.roles.failed}`, inline: true },
            { name: 'Roles Created', value: `${results.rolesCreated.success}`, inline: true },
            { name: 'Duration', value: `${results.duration}ms`, inline: false }
          )
          .setFooter({ text: `Executed by: ${userId}` })
          .setTimestamp();

        if (results.channels.errors.length > 0 || results.roles.errors.length > 0) {
          resultEmbed.addFields({
            name: 'Errors',
            value: [...results.channels.errors, ...results.roles.errors].slice(0, 10).join('\n') || 'None',
            inline: false,
          });
        }

        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('syednukeall_confirm')
            .setLabel('🔥 I UNDERSTAND - DELETE ALL')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('syednukeall_cancel')
            .setLabel('❌ CANCEL - DO NOT DELETE')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

        await message.edit({
          embeds: [resultEmbed],
          components: [disabledRow],
        }).catch(() => {});

        logger.logOperation(userId, guildId, 'syednukeall', 'COMPLETED', `Deleted ${results.channels.success} channels and ${results.roles.success} roles`);
      } catch (error) {
        logger.error(`Error updating result message: ${error.message}`);
      }
    })
    .catch((error) => {
      logger.error(`Async nuke operation error: ${error.message}`);
    })
    .finally(() => {
      activeOperations.delete(guildId);
    });

  // Immediate response to Discord
  const processingEmbed = new EmbedBuilder()
    .setColor('#FFAA00')
    .setTitle('🔄 SYEDNUKEALL IN PROGRESS')
    .setDescription('Deleting all channels and roles...')
    .setFooter({ text: 'This may take a while depending on server size' })
    .setTimestamp();

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('syednukeall_confirm')
      .setLabel('🔥 I UNDERSTAND - DELETE ALL')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('syednukeall_cancel')
      .setLabel('❌ CANCEL - DO NOT DELETE')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );

  await message.edit({
    embeds: [processingEmbed],
    components: [disabledRow],
  }).catch(() => {});
}
