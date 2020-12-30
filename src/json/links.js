import twitch from '../images/twitch.png'
import discord from '../images/discord.png'
import twitter from '../images/twitter.png'
import youtube from '../images/youtube.png'

export const YTMap = new Map([
    ['first-video', 'https://www.youtube.com/embed/jmiaiCw3V98'],
    ['beat#1', 'https://www.youtube.com/embed/Dh44j5dXnFM']
])

const twitchUrl = "https://www.twitch.tv/clashwithdeejandhades";
const discordUrl = "https://discord.gg/bRMb8sB";
const twitterUrl = "https://twitter.com/DeeJandHades";
const youtubeUrl = "https://www.youtube.com/channel/UCkMFJCWZNqCmVqIykR5Hn7Q";

const ssj1 = (url, image) => ({
    url,
    image
})

export const mappingAround = new Map([
    ['twitch', ssj1(twitchUrl, twitch)],
    ['discord', ssj1(discordUrl, discord)],
    ['twitter', ssj1(twitterUrl, twitter)],
    ['youtube', ssj1(youtubeUrl, youtube)]
]);
