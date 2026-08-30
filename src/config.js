import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const parseOwnerIds = () => {
  const rawValue = process.env.OWNER_IDS || process.env.OWNER_ID || '';
  return rawValue
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

export default {
  token: process.env.DISCORD_TOKEN,
  ownerId: process.env.OWNER_ID,
  ownerIds: parseOwnerIds(),
  prefix: process.env.PREFIX || '>',
  memberTestMode: process.env.MEMBER_TEST_MODE === 'true',
  serverInviteUrl: process.env.SERVER_INVITE_URL || 'https://discord.gg/TW9dTu7YKS',
  maxTestChannels: parseInt(process.env.MAX_TEST_CHANNELS || '100'),
  maxTestRoles: parseInt(process.env.MAX_TEST_ROLES || '1'),
  messageDelay: parseInt(process.env.MESSAGE_DELAY || '150'),
  mentionMode: process.env.MENTION_MODE || 'none',
  testChannelPrefix: 'syed-test-',
  testRolePrefix: 'syed-test-role-',
  logsDir: path.join(__dirname, '../logs'),
  confirmationTimeout: 30000,
};
