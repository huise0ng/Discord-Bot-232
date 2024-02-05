const { Client, GatewayIntentBits } = require('discord.js');
const RSSParser = require('rss-parser');
const parser = new RSSParser();
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const BOT_TOKEN = 'Bot Token'; 
const CHANNEL_ID = 'Server Num'; 
const VELOGBLOG_RSS_URL = 'https://v2.velog.io/rss/@이 코드를 사용할 분의 벨로그 아이디'; 
let lastLink = ''; 

client.once('ready', () => {
    console.log(`${client.user.tag}가 디스코드에 연결되었습니다!`);
    checkVelogFeed();
    setInterval(checkVelogFeed, 10 * 60 * 1000); 
});

async function checkVelogFeed() {
    let feed = await parser.parseURL(VELOGBLOG_RSS_URL);
    if (feed.items.length > 0) {
        const { link, title } = feed.items[0]; 

        if (link !== lastLink) {
            lastLink = link; 
            const messageChannel = await client.channels.fetch(CHANNEL_ID);
            if (messageChannel) {
                messageChannel.send(`희성님의 벨로그에 새 글이 올라왔어요! ${title}\n${link}`);
            }
        }
    }
}

client.login(BOT_TOKEN);
