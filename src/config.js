import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

export default {
  token: process.env.DISCORD_TOKEN,
  ownerId: process.env.OWNER_ID,
  prefix: process.env.PREFIX || '>',
  memberTestMode: process.env.MEMBER_TEST_MODE === 'true',
  serverInviteUrl: process.env.SERVER_INVITE_URL || 'https://discord.gg/TW9dTu7YKS',
  maxTestChannels: parseInt(process.env.MAX_TEST_CHANNELS || '10'),
  maxTestRoles: parseInt(process.env.MAX_TEST_ROLES || '5'),
  messageDelay: parseInt(process.env.MESSAGE_DELAY || '1500'),
  mentionMode: process.env.MENTION_MODE || 'none',
  testChannelPrefix: 'syed-test-',
  testRolePrefix: 'syed-test-role-',
  logsDir: path.join(__dirname, '../logs'),
  confirmationTimeout: 30000,
};
