import { createClient } from 'redis';

export const redisKeys = Object.freeze({
    mentions: "mentions",
    totalSentiment: "totalSentiment",
    mentionsSorted: "mentionsSorted",
    sentimentSorted: "sentimentSorted",
    currentSummary: "currentSummary",
    currentTrends: "currentTrends",
    subtopics: "subtopics", 
    messagesList: "messagesList",
    summariesList: "summariesList",
    news: "newsList"
});




export async function trim(key, start, stop) {
    await redisClient.lTrim(key, start, stop);
}

export async function add(key, item) {
    await redisClient.lPush(key, item);
}


export const redisClient = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();
