# SYEDNUKE Bot — Discord Testing & Reset Utility

A safe, controlled Discord bot designed for testing server resources. The bot only operates on resources it creates itself (prefixed with `syed-test-`) and respects all Discord permissions and API rate limits.

## Features

✅ **Safe Testing** - Only affects bot-created test resources  
✅ **Confirmation Required** - All operations need user confirmation  
✅ **Respects Permissions** - Follows Discord permission system  
✅ **Rate Limit Handling** - Automatically handles Discord API limits  
✅ **Complete Logging** - All operations logged with timestamps  
✅ **Error Recovery** - Handles failures gracefully without crashing  

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** (comes with Node.js)
- A Discord application with bot token
- A Discord server you own or manage

## Installation

### Step 1: Install Node.js

1. Visit [nodejs.org](https://nodejs.org)
2. Download the LTS version
3. Run the installer and follow the prompts
4. Verify installation by opening PowerShell and running:
   ```powershell
   node --version
   npm --version
   ```

### Step 2: Open Project in VS Code

1. Open **VS Code**
2. Click **File** → **Open Folder**
3. Navigate to the `syednuke` project folder
4. Click **Select Folder**

### Step 3: Install Dependencies

1. Open Terminal in VS Code (Ctrl + `)
2. Run:
   ```bash
   npm install
   ```

This installs discord.js v14 and dotenv.

### Step 4: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Give it a name (e.g., "SYEDNUKE")
4. Go to the **Bot** tab
5. Click **Add Bot**
6. Under the bot's username, click **Copy** to copy the token
7. Save the token safely (you'll need it in the next step)

### Step 5: Configure Environment

1. In your project folder, create a `.env` file (use `.env.example` as reference):
   ```
   DISCORD_TOKEN=your_bot_token_here
   OWNER_ID=your_discord_user_id_here
   
   PREFIX=>
   
   MEMBER_TEST_MODE=true
   
   SERVER_INVITE_URL=https://discord.gg/TW9dTu7YKS
   
   MAX_TEST_CHANNELS=10
   MAX_TEST_ROLES=5
   
   MESSAGE_DELAY=1500
   
   MENTION_MODE=none
   ```

2. Replace:
   - `your_bot_token_here` with the token from Step 4
   - `your_discord_user_id_here` with your Discord user ID (get it by enabling Developer Mode in Discord settings)

### Step 6: Invite Bot to Server

1. Go back to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **OAuth2** → **URL Generator**
4. Select scopes: `bot`
5. Select permissions:
   - Manage Channels
   - Manage Roles
   - Send Messages
   - Read Message History
6. Copy the generated URL and open it in your browser
7. Select your test server and authorize

### Step 7: Run the Bot

In VS Code Terminal, run:
```bash
npm start
```

You should see output like:
```
[2026-08-30T...] [INFO] 🚀 Starting SYEDNUKE Bot...
[2026-08-30T...] [INFO] ✅ Bot is ready! Logged in as SYEDNUKE#1234
```

## Required Bot Permissions

Make sure your bot has these permissions in your test server:

- ✅ Manage Channels (for test channel operations)
- ✅ Manage Roles (for test role operations)  
- ✅ Send Messages (for command responses)
- ✅ Read Message History (for message operations)

## Commands

### `>syednuke`

**Start the safe test reset**

Deletes all bot-created test channels and roles, then shows confirmation dialog.

```
User: >syednuke
Bot: Shows confirmation embed with 30-second expiration
     Buttons: ✅ CONFIRM RESET | ❌ CANCEL
```

After confirmation:
- 🧹 Deletes all `syed-test-*` channels
- 🧹 Deletes all `syed-test-role-*` roles
- 🏁 Reports success/failure counts

---

### `>syedlink`

**Post server invite to test channels**

Sends the configured invite URL to all bot-created test channels with proper rate limiting.

```
User: >syedlink
Bot: Posts invite embed to each test channel
     Shows final result (success/failed counts)
```

---

### `>syedstatus`

**Display bot status and statistics**

Shows:
- Bot connectivity status
- Network ping
- Guild name and ID
- Test channel count
- Test role count
- Member test mode status
- Configuration status

```
User: >syedstatus
Bot: Shows comprehensive status embed
```

---

### `>syedcancel`

**Cancel an active operation**

Cancels a running SYEDNUKE operation. (Note: Use the ❌ CANCEL button during confirmation for active operations)

---

### `>syedhelp`

**Display all commands and help**

Shows all available commands with descriptions and safety information.

```
User: >syedhelp
Bot: Shows complete help embed
```

---

## Configuration

Edit `.env` to customize behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `DISCORD_TOKEN` | Required | Your bot token from Discord Developer Portal |
| `OWNER_ID` | Required | Your Discord user ID |
| `PREFIX` | `>` | Command prefix (e.g., `>syednuke`) |
| `MEMBER_TEST_MODE` | `true` | Allow members to use commands |
| `SERVER_INVITE_URL` | Link | URL posted by `>syedlink` |
| `MAX_TEST_CHANNELS` | `10` | Maximum test channels to create |
| `MAX_TEST_ROLES` | `5` | Maximum test roles to create |
| `MESSAGE_DELAY` | `1500` | Milliseconds between API calls (respects rate limits) |
| `MENTION_MODE` | `none` | Mention behavior (none/everyone) |

## Safety Features

### Protected Resources

The bot will NEVER delete:
- ✅ `@everyone` role
- ✅ Administrator roles
- ✅ User-created channels/roles
- ✅ Managed roles (bot roles, integration roles)

### Only Bot-Created Resources Are Affected

Only channels and roles with the `syed-test-` prefix are touched:
- `syed-test-001`, `syed-test-002`, etc. (channels)
- `syed-test-role-001`, `syed-test-role-002`, etc. (roles)

### Rate Limit Handling

The bot automatically:
- Waits between API calls
- Respects Discord's rate limits
- Never bypasses throttling
- Queues operations safely

### Confirmation Required

All destructive operations require:
- User confirmation via button
- 30-second expiration timer
- Only command executor can confirm

## Troubleshooting

### Bot Won't Start

**Error:** `DISCORD_TOKEN is not set in .env file`

**Solution:** 
1. Create `.env` file in project root
2. Add your bot token from Discord Developer Portal
3. Run `npm start` again

---

### "Missing Permissions"

**Error:** Bot doesn't respond to commands

**Solution:**
1. Check bot has "Manage Channels", "Manage Roles", "Send Messages" permissions
2. Check bot's role is above the target channels/roles in the hierarchy
3. Ensure bot is in the guild

---

### Commands Not Responding

**Check:**
1. Prefix is correct (default: `>`)
2. Using exact command names: `syednuke`, `syedlink`, etc.
3. Bot is online (should say "Online" in Discord)
4. Check logs in `logs/` folder for errors

---

### Rate Limit Errors

The bot handles Discord's rate limits automatically. If you see slowness:
- Increase `MESSAGE_DELAY` in `.env` (in milliseconds)
- Default of 1500ms is 1.5 seconds between API calls

---

## Logs

All operations are logged to `logs/bot-YYYY-MM-DD.log`:

```
[2026-08-30T12:34:56.789Z] [INFO] 🔄 Starting SYEDNUKE test...
[2026-08-30T12:34:57.123Z] [INFO] 🧹 Cleaning bot-created test channels...
[2026-08-30T12:34:58.456Z] [INFO] ✅ Deleted test channel: syed-test-001
[2026-08-30T12:34:59.789Z] [INFO] 🏁 SYEDNUKE TEST COMPLETE
```

Logs include:
- Timestamps
- User ID and Guild ID
- Command executed
- Success/failure status
- Error messages (if any)

Bot token is NEVER logged.

---

## Development Mode

To run with auto-reload on file changes:

```bash
npm run dev
```

This uses Node's `--watch` flag to restart on edits.

---

## Project Structure

```
syednuke/
├── src/
│   ├── index.js              # Main bot file
│   ├── config.js             # Configuration loader
│   ├── commands/
│   │   ├── syednuke.js       # Main reset command
│   │   ├── syedlink.js       # Invite posting
│   │   ├── syedstatus.js     # Status display
│   │   ├── syedcancel.js     # Cancel operation
│   │   └── syedhelp.js       # Help display
│   └── utils/
│       ├── logger.js         # Logging system
│       ├── validators.js     # Input validation
│       ├── permissions.js    # Permission checks
│       ├── cleanup.js        # Cleanup logic
│       ├── testChannels.js   # Channel management
│       ├── testRoles.js      # Role management
│       └── rateLimit.js      # Rate limiting
├── logs/                     # Log files (auto-created)
├── package.json              # Dependencies
├── .env.example              # Configuration template
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

---

## Security Considerations

⚠️ **DO NOT:**
- Share your bot token in repositories
- Commit `.env` file to Git
- Use this bot in production/public servers
- Change code to bypass safety checks

✅ **DO:**
- Use `.env` for sensitive data
- Test in private/owned servers only
- Review logs for suspicious activity
- Keep Node.js and dependencies updated

---

## Support & Issues

If the bot crashes or doesn't work:

1. Check `logs/bot-YYYY-MM-DD.log` for error messages
2. Verify `.env` configuration
3. Ensure bot has required permissions
4. Restart: `npm start`

---

## Version

**SYEDNUKE v1.0.0**  
Built with discord.js v14

---

**Ready to go!** 🚀 

Run `npm install` then `npm start` to launch your bot.
