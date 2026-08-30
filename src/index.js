import {
  Client,
  GatewayIntentBits,
  ChannelType,
} from 'discord.js';
import config from './config.js';
import logger from './utils/logger.js';
import {
  validateToken,
  validateOwnerId,
  validateInviteUrl,
  isOwnerUser,
} from './utils/validators.js';
import { command as syednukeCommand } from './commands/syednuke.js';
import { command as syednukeallCommand } from './commands/syednukeall.js';
import { command as syedlinkCommand } from './commands/syedlink.js';
import { command as syedstatusCommand } from './commands/syedstatus.js';
import { command as syedcancelCommand } from './commands/syedcancel.js';
import { command as syedhelpCommand } from './commands/syedhelp.js';

const commands = new Map([
  ['syednuke', syednukeCommand],
  ['syednukeall', syednukeallCommand],
  ['syedlink', syedlinkCommand],
  ['syedstatus', syedstatusCommand],
  ['syedcancel', syedcancelCommand],
  ['syedhelp', syedhelpCommand],
]);

let client;

function validateConfiguration() {
  logger.info('Validating configuration...');

  try {
    validateToken();
    validateOwnerId();
    validateInviteUrl();
    logger.info('✅ Configuration validated successfully');
  } catch (error) {
    logger.error(`Configuration validation failed: ${error.message}`);
    process.exit(1);
  }
}

function initializeClient() {
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
  });

  client.on('ready', onReady);
  client.on('messageCreate', onMessageCreate);
  client.on('interactionCreate', onInteractionCreate);
  client.on('error', onError);
  client.on('warn', onWarn);
}

function onReady() {
  logger.info(
    `✅ Bot is ready! Logged in as ${client.user.tag}`
  );
  logger.info(`Bot ID: ${client.user.id}`);
  logger.info(`Prefix: ${config.prefix}`);
  logger.info(`Guilds: ${client.guilds.cache.size}`);
  client.user.setActivity(`${config.prefix}syedhelp`, { type: 'WATCHING' });
}

async function onMessageCreate(message) {
  try {
    if (message.author.bot) return;

    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/\s+/);
    const commandName = args[0].toLowerCase();

    const command = commands.get(commandName);

    if (!command) {
      return message.reply(
        `❌ Unknown command: \`${commandName}\`. Use \`${config.prefix}syedhelp\` for help.`
      );
    }

    if (!isOwnerUser(message.author.id)) {
      logger.warn(
        `🚫 Command "${commandName}" rejected for unauthorized user ${message.author.tag} in guild ${message.guild.name}`
      );
      return message.reply('❌ This bot is restricted to the two configured owners only.');
    }

    logger.info(
      `📝 Command "${commandName}" executed by ${message.author.tag} in guild ${message.guild.name}`
    );

    await command.execute(message);
  } catch (error) {
    logger.error(`Error handling message: ${error.message}`);
    message.reply('❌ An error occurred while processing your command.').catch((e) =>
      logger.error(`Failed to send error message: ${e.message}`)
    );
  }
}

async function onInteractionCreate(interaction) {
  try {
    if (!interaction.isButton()) return;

    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate().catch(() => {});
    }

    const customId = interaction.customId;

    if (customId === 'syednuke_confirm' || customId === 'syednuke_cancel') {
      const syednukeCommand = commands.get('syednuke');
      if (syednukeCommand && syednukeCommand.handleButtonInteraction) {
        await syednukeCommand.handleButtonInteraction(interaction).catch((error) => {
          logger.error(`Button interaction error: ${error.message}`);
        });
      }
    }

    if (customId === 'syednukeall_confirm' || customId === 'syednukeall_cancel') {
      const syednukeallCommand = commands.get('syednukeall');
      if (syednukeallCommand && syednukeallCommand.handleButtonInteraction) {
        await syednukeallCommand.handleButtonInteraction(interaction).catch((error) => {
          logger.error(`Button interaction error: ${error.message}`);
        });
      }
    }
  } catch (error) {
    logger.error(`Error in interactionCreate: ${error.message}`);
  }
}

function onError(error) {
  logger.error(`Client error: ${error.message}`);
}

function onWarn(warning) {
  logger.warn(`Client warning: ${warning}`);
}

export { client };

async function main() {
  logger.info('🚀 Starting SYEDNUKE Bot...');
  logger.info(`Version: 1.0.0`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'production'}`);

  validateConfiguration();
  initializeClient();

  try {
    await client.login(config.token);
  } catch (error) {
    logger.error(`Failed to login: ${error.message}`);
    process.exit(1);
  }
}

main();

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled rejection: ${error.message}`);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  if (client) {
    client.destroy();
  }
  process.exit(0);
});

export default client;
