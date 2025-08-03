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
    summariesList: "summariesList"
});


export async function incrAndExpire(key, field, incrementBy, expireSeconds) {    // uses global redisClient
    await redisClient.hIncrBy(key, field, incrementBy);
    await redisClient.hExpire(key, field, expireSeconds);
    console.log(`iAE'd ${key} ${field}`);
}

export async function trim(key, start, stop) {
    await redisClient.lTrim(key, start, stop);
}

export async function add(key, item) {
    await redisClient.lPush(key, item);
}


export const redisClient = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();
