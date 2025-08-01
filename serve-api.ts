import { createClient } from 'redis';
import { redisKeys } from "./redisUtils.ts";


const redisClient = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

const getDailyMentions = async () => {
    const result = await redisClient.hGetAll(redisKeys.mentions);
    const dailies = Object.fromEntries(
        Object.keys(result).filter(key => key.split("_").length == 2).map(key => [key, parseInt(result[key])])
    );
    console.log("hgetall mentions: ", dailies);
    return dailies;
}

const getDailySentiment = async () => {
    const result = await redisClient.hGetAll(redisKeys.totalSentiment);
    const dailies = Object.fromEntries(
        Object.keys(result).filter(key => key.split("_").length == 2).map(key => [key, parseInt(result[key])])
    );
    console.log("hgetall sentiment: ", dailies);
    return dailies;
}

const minutesForSortedGet = 5;

const getSortedMentions = async () => {
    const fields = await redisClient.zRangeByScore(redisKeys.mentionsSorted, Date.now() - 1000 * 60 * minutesForSortedGet, Infinity); // last 1 minute
    const tickersTimes = fields.map(field => field.split("_")).map(x => [x[0], parseInt(x[1])]);
    const tickersUnique = [...new Set(tickersTimes.map(x => x[0]))];
    let sumObject = Object.fromEntries(tickersUnique.map(x => [x,0]));
    tickersTimes.forEach(tickerScore => sumObject[tickerScore[0]] += 1);
    // console.log(tickersTimes);
    console.log("mentions sum last 5 minutes: ", sumObject);
    return sumObject;
}

const getSortedSentiment = async () => {
    const fields = await redisClient.zRangeByScore(redisKeys.sentimentSorted, Date.now() - 1000 * 60 * minutesForSortedGet, Infinity); // last 1 minute
    const tickerSentimentTime_list = fields.map(field => field.split("_")).map(x => [x[0], parseInt(x[1]), parseInt(x[2])]);
    const tickersUnique = [...new Set(tickerSentimentTime_list.map(x => x[0]))];
    let sumObject = Object.fromEntries(tickersUnique.map(x => [x,0]));
    tickerSentimentTime_list.forEach(tickerTimeSentiment => sumObject[tickerTimeSentiment[0]] += tickerTimeSentiment[1] as number);
    // console.log(tickerSentimentTime_list);
    console.log("sentiment sum last 5 minutes: ", sumObject);
    return sumObject;
}

const removeSortedsetValuesOlderThan5minutes = async () => {
    await redisClient.zRemRangeByScore(redisKeys.mentionsSorted, -Infinity, Date.now() - 1000 * 60 * 5);
}

const getCurrentSummaryAndTrends = async () => {
    const key = redisKeys.currentSummary;
    const summary = await redisClient.get(key);
    const trends = await redisClient.get(redisKeys.currentTrends);
    return {
        summary: summary,
        trends: trends
    };
}


// print demo values to console; express server should be fired up here when actually serving
await getDailyMentions();
await getDailySentiment();
await getSortedMentions();
await getSortedSentiment();
await getCurrentSummaryAndTrends();
await removeSortedsetValuesOlderThan5minutes();
await redisClient.disconnect();
