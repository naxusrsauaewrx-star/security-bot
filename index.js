/**
 * Discord.js v14 AutoMod Bot with GUI Select Menu (ปรับปรุงใหม่ตามคำสั่งล่าสุด)
 * Features:
 * - /menu command สาธารณะพร้อม Select Menu สถานะจริงแบบเรียลไทม์
 * - Anti-Spam: ลบข้อความทันที, ล็อกห้องแบบล็อกทุกยศถ้าแบนไม่ได้
 * - Anti-Link: (discord invite, token, http/https) => ban
 * - Anti-Mass Mention: ลบข้อความทันที, หาก mention @everyone/@here > 3 ครั้งรวม => ban (ยกเว้นแอดมิน)
 * - Anti-Mass Mention 2: ลบข้อความทันที, หาก mention @everyone/@here 1 ครั้ง => ban (ยกเว้นแอดมิน)
 * - Admin Role Monitor: หากได้ยศแอดมินแม้แต่ครั้งเดียวจะโดนปลดยศทันที + log (ยกเว้นปิดระบบ)
 * - ทุก Embed/log มีภาพใหญ่จาก .env (IMG_URL)
 * - Log แบบ embed พร้อม timestamp และ footer ไทย "© 𝗦𝗲𝗰𝘂𝗿𝗶𝘁𝘆 𝗧𝗼𝗿𝘂 | ระบบป้องกัน"
 */

c
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  Events,
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// กำหนดสถานะเริ่มต้นของระบบ AutoMod
const config = {
  antiSpam: false,
  antiLink: false,
  antiMention: false,
  antiMention2: false,
  adminMonitor: false,
};

// Map สำหรับเก็บข้อมูลสแปมและเมนชั่น
const spamMap = new Map();
const mentionMap = new Map();

// ค่าคงที่สำหรับระบบป้องกัน
const SPAM_THRESHOLD = 2;
const SPAM_INTERVAL = 3000;
const MENTION_LIMIT = 3;

client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setActivity("/menu - AutoMod System");

  const menuCommand = {
    name: "menu",
    description: "เปิดหน้าตั้งค่าระบบ AutoMod",
  };

  await client.application.commands.set([menuCommand]);
  console.log("✅ Slash command /menu registered globally.");
});

// ฟังก์ชันสร้าง Select Menu
function createSelectMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId("config-select")
    .setPlaceholder("🛡️ เลือกระบบป้องกันเพื่อเปิด/ปิด")
    .addOptions([
      {
        label: `Anti-Spam | สถานะ: ${config.antiSpam ? "เปิด" : "ปิด"}`,
        description: "ระบบตรวจจับและแบนผู้ที่สแปมข้อความ",
        value: "antiSpam",
        emoji: "🕸️",
      },
      {
        label: `Anti-Link | สถานะ: ${config.antiLink ? "เปิด" : "ปิด"}`,
        description: "ระบบตรวจจับและแบนผู้ที่ส่งลิงก์เชิญ Discord",
        value: "antiLink",
        emoji: "🕸️",
      },
      {
        label: `Anti-Mass Mention (x${MENTION_LIMIT}) | สถานะ: ${config.antiMention ? "เปิด" : "ปิด"}`,
        description: `ระบบแบนผู้ที่ mention @everyone/@here มากกว่า ${MENTION_LIMIT} ครั้ง`,
        value: "antiMention",
        emoji: "🕸️",
      },
      {
        label: `Anti-Mass Mention (x1) | สถานะ: ${config.antiMention2 ? "เปิด" : "ปิด"}`,
        description: "ระบบแบนผู้ที่ mention @everyone/@here เพียงครั้งเดียว",
        value: "antiMention2",
        emoji: "🕸️",
      },
      {
        label: `Admin Role Monitor | สถานะ: ${config.adminMonitor ? "เปิด" : "ปิด"}`,
        description: "ระบบตรวจสอบผู้ที่ได้รับยศแอดมินและปลดยศอัตโนมัติ",
        value: "adminMonitor",
        emoji: "🕸️",
      },
    ]);
}

// ตรวจจับเหตุการณ์ InteractionCreate
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === "menu") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ คุณไม่มีสิทธิ์ในการใช้งานคำสั่งนี้",
        ephemeral: true,
      });
    }

    const row = new ActionRowBuilder().addComponents(createSelectMenu());
    const linkButton = new ButtonBuilder()
      .setLabel("🌐 Support Server")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/YOUR_SUPPORT_LINK");

    const buttonRow = new ActionRowBuilder().addComponents(linkButton);

    const embed = new EmbedBuilder()
      .setTitle("⚙️ การตั้งค่าระบบ AutoMod")
      .setDescription("กรุณาเลือกการตั้งค่าที่ต้องการเปิด/ปิดจากเมนูด้านล่าง")
      .setImage(process.env.IMG_URL || null)
      .setColor("Blue")
      .setFooter({ text: "© 𝗦𝗲𝗰𝘂𝗿𝗶𝘁𝘆 𝗧𝗼𝗿𝘂 | ระบบป้องกัน" })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      components: [row, buttonRow],
      ephemeral: true,
    });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "config-select") {
    const selected = interaction.values[0];
    config[selected] = !config[selected];

    const embed = new EmbedBuilder()
      .setTitle("⚙️ การตั้งค่าระบบ AutoMod")
      .setDescription(`ระบบ **${selected}** ถูก**${config[selected] ? "เปิด" : "ปิด"}** เรียบร้อยแล้ว`)
      .setColor(config[selected] ? "Green" : "Red")
      .setImage(process.env.IMG_URL || null)
      .setFooter({ text: "© 𝗦𝗲𝗰𝘂𝗿𝗶𝘁𝘆 𝗧𝗼𝗿𝘂 | ระบบป้องกัน" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(createSelectMenu());

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  }
});

// ตรวจจับเหตุการณ์ MessageCreate
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  const guild = message.guild;

  // ตรวจสอบว่าผู้ใช้มีสิทธิ์ Administrator หรือไม่
  const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

  // Anti-Spam
  if (config.antiSpam && !isAdmin) { // แก้ไข: เพิ่มเงื่อนไข !isAdmin
    let timestamps = spamMap.get(message.author.id) || [];
    const now = Date.now();
    timestamps = timestamps.filter((t) => now - t < SPAM_INTERVAL);
    timestamps.push(now);
    spamMap.set(message.author.id, timestamps);

    if (timestamps.length >= SPAM_THRESHOLD) {
      try {
        await message.delete(); // ลบข้อความทันที
        await message.member.ban({ reason: "สแปมข้อความ" });
        await sendLog(guild, `🔨 <@${message.author.id}> ถูกแบนเนื่องจากสแปมข้อความ`);
      } catch (error) {
        await lockChannel(message.channel, guild, "สแปมข้อความ แต่ไม่สามารถแบนได้");
        console.error("Failed to ban for spam:", error);
      }
      spamMap.delete(message.author.id);
    }
  }

  // Anti-Link
  if (config.antiLink && !isAdmin) { // แก้ไข: เพิ่มเงื่อนไข !isAdmin
    const linkRegex = /(discord\.gg|discordapp\.com\/invite|discord\.com\/invite|token|https?:\/\/[^\s]+)/i;
    if (linkRegex.test(message.content)) {
      try {
        await message.delete();
        await message.member.ban({ reason: "ส่งลิงก์ต้องห้าม" });
        await sendLog(guild, `🔨 <@${message.author.id}> ถูกแบนเนื่องจากส่งลิงก์ต้องห้าม`);
      } catch (error) {
        await lockChannel(message.channel, guild, "ส่งลิงก์ต้องห้าม แต่ไม่สามารถแบนได้");
        console.error("Failed to ban for link:", error);
      }
    }
  }

  // Anti-Mention (แบบเก่า > 3 ครั้ง)
  if (config.antiMention && !isAdmin) {
    const mentions = (message.content.match(/@everyone|@here/gi) || []).length;
    if (mentions > 0) {
      const count = (mentionMap.get(message.author.id) || 0) + mentions;
      mentionMap.set(message.author.id, count);

      if (count > MENTION_LIMIT) {
        try {
          await message.delete(); // ลบข้อความทันที
          await message.member.ban({ reason: "Mention เกิน 3 ครั้งรวม" });
          await sendLog(guild, `🔨 <@${message.author.id}> ถูกแบนจากการ mention @everyone/@here เกิน 3 ครั้ง`);
        } catch (error) {
          await lockChannel(message.channel, guild, "Mass mention แต่ไม่สามารถแบนได้");
          console.error("Failed to ban for mention:", error);
        }
        mentionMap.delete(message.author.id);
      }
    }
  }

  // Anti-Mention 2 (แบบใหม่ 1 ครั้ง)
  if (config.antiMention2 && !isAdmin) {
    const mentions = (message.content.match(/@everyone|@here/gi) || []).length;
    if (mentions > 0) {
      try {
        await message.delete(); // ลบข้อความทันที
        await message.member.ban({ reason: "Mention @everyone หรือ @here" });
        await sendLog(guild, `🔨 <@${message.author.id}> ถูกแบนเนื่องจาก mention @everyone/@here`);
      } catch (error) {
        await lockChannel(message.channel, guild, "Mass mention 1 ครั้ง แต่ไม่สามารถแบนได้");
        console.error("Failed to ban for mention 2:", error);
      }
    }
  }
});

// ตรวจจับเหตุการณ์ GuildMemberUpdate
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (!config.adminMonitor) return;

  const addedRoles = newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id));
  const adminRoles = newMember.guild.roles.cache.filter((r) =>
    r.permissions.has(PermissionsBitField.Flags.Administrator)
  );

  for (const [roleId, role] of adminRoles) {
    if (addedRoles.has(roleId)) {
      try {
        await newMember.roles.remove(role, "Admin role granted (auto-remove)");
        await sendLog(newMember.guild, `⚠️ <@${newMember.id}> ได้รับยศแอดมิน **${role.name}** และถูกปลดยศอัตโนมัติทันที`);
      } catch (error) {
        console.error("Failed to remove admin role:", error);
      }
    }
  }
});

// ฟังก์ชันสร้าง/ค้นหาช่อง log
async function ensureLogChannel(guild) {
  let logCh = guild.channels.cache.find((ch) => ch.name === "𝗣𝗿𝗼𝘁𝗲𝗰𝘁𝗶𝗼𝗻" && ch.isTextBased());
  if (!logCh) {
    logCh = await guild.channels.create({
      name: "𝗣𝗿𝗼𝘁𝗲𝗰𝘁𝗶𝗼𝗻",
      type: 0,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions],
        },
      ],
    });
  }
  return logCh;
}

// ฟังก์ชันส่ง log แบบ Embed
async function sendLog(guild, content) {
  const logCh = await ensureLogChannel(guild);
  const embed = new EmbedBuilder()
    .setTitle("🔔 แจ้งเตือนระบบ AutoMod")
    .setDescription(content)
    .setColor("Orange")
    .setImage(process.env.IMG_URL || null)
    .setFooter({ text: "© 𝗦𝗲𝗰𝘂𝗿𝗶𝘁𝘆 𝗧𝗼𝗿𝘂 | ระบบป้องกัน" })
    .setTimestamp();
  await logCh.send({ embeds: [embed] });
}

// ฟังก์ชันล็อกช่อง (ปรับปรุงใหม่)
async function lockChannel(channel, guild, reason) {
  try {
    await channel.permissionOverwrites.set([]);
    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      SendMessages: false,
      AddReactions: false,
    });
    await sendLog(guild, `🔒 ล็อคห้อง <#${channel.id}> เนื่องจาก: **${reason}**`);
  } catch (error) {
    console.error(`Failed to lock channel ${channel.id}:`, error);
  }
}

// Login
client.login(process.env.TOKEN);