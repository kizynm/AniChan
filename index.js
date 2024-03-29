const { Client, Intents, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const commands = new Collection();

const token = process.env.BOT_TOKEN;

const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    commands.set(command.data.name, command);
  }
}

client.once('ready', () => {
  console.log(`${client.user.tag} sẵn sàng!`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  const command = commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    interaction.reply('Đã xảy ra lỗi khi thực hiện lệnh này.');
  }
});

client.login(token).then(() => {
  console.log('Đang đăng ký lệnh...');
  const commandsArray = commands.map(command => command.data.toJSON());
  const rest = new REST({ version: '9' }).setToken(token);

  rest.put(Routes.applicationCommands(client.user.id), { body: commandsArray })
    .then(() => console.log('Đã đăng ký lệnh thành công!'))
    .catch(error => console.error('Đã xảy ra lỗi khi đăng ký:', error));
});
require('./status');
client.on('guildCreate', async (guild) => {
  try {
    console.log(`Đã tham gia máy chủ: ${guild.name} (ID: ${guild.id}).`);

    const commandsArray = commands.map(command => command.data.toJSON());
    const rest = new REST({ version: '9' }).setToken(token);

    await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commandsArray });

    console.log(`Đã đăng ký lệnh cho máy chủ: ${guild.name} (ID: ${guild.id})`);
  } catch (error) {
    console.error(`Đã xảy ra lỗi khi đăng ký lệnh cho máy chủ: ${guild.name} (ID: ${guild.id})`, error);
  }
});
