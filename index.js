const { Client, GatewayIntentBits } = require('discord.js');
const RSSParser = require('rss-parser');
const fs = require('fs');
const parser = new RSSParser();
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const BOT_TOKEN = '';
let feeds = {};


try {
    feeds = JSON.parse(fs.readFileSync('feeds.json', 'utf8'));
} catch (error) {
    console.log('Feeds 파일을 불러오는데 실패했습니다. 새로 생성합니다.');
    fs.writeFileSync('feeds.json', JSON.stringify(feeds), 'utf8');
}

client.once('ready', () => {
    console.log(`${client.user.tag}가 디스코드에 연결되었습니다!`);
    checkAllFeeds();
    setInterval(checkAllFeeds, 10 * 60 * 1000); 
});

client.on('messageCreate', async message => {
    if (message.content.startsWith('!yeesamee')) {
        const args = message.content.split(' ').slice(1);
        if (args.length < 2) {
            return message.reply('사용법: !yeesamee Velog RSS_URL Channel_ID');
        }
        const [rssUrl, channelId] = args;
        
        if(!feeds[message.author.id]) {
            feeds[message.author.id] = {};
        }
        
        feeds[message.author.id][channelId] = { rssUrl, lastLink: '' };

        fs.writeFileSync('feeds.json', JSON.stringify(feeds, null, 4), 'utf8');
        return message.reply('피드 정보를 확인했습니다. 서비스가 실행되기까지 10분을 기다려주세요!');
    }
});

async function checkAllFeeds() {
    for (const userId in feeds) {
        for (const channelId in feeds[userId]) {
            const userFeed = feeds[userId][channelId];
            try {
                await checkFeedForUser(userFeed, userId, channelId);
            } catch (error) {
                console.error(`피드를 체크하는 도중 오류가 발생했습니다: ${error.message}`);
            }
        }
    }
}

async function checkFeedForUser(userFeed, userId, channelId) {
    const { rssUrl, lastLink } = userFeed;
    let feed = await parser.parseURL(rssUrl);
    if (feed.items.length > 0) {
        const { link, title } = feed.items[0]; 

        if (link !== lastLink) {
            userFeed.lastLink = link; 
            feeds[userId][channelId] = userFeed;
            fs.writeFileSync('feeds.json', JSON.stringify(feeds, null, 4), 'utf8');

            const messageChannel = await client.channels.fetch(channelId);
            if (messageChannel) {
                messageChannel.send(`새 글이 올라왔어요! ${title}\n${link}`);
            }
        }
    }
}

client.login(BOT_TOKEN);
