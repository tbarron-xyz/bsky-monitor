
import { Jetstream } from "@skyware/jetstream";

import { redisClient } from "./redisUtils.ts";
import { getTrendsFromTweets } from './ai-apis.ts';
import { forEachTweet } from './sentiment-analysis.ts';
// const redisKeys = require("./redisKeys");

const jetstream = new Jetstream({
	wantedCollections: ["app.bsky.feed.post",
        //  "app.bsky.feed.like"
        ], // omit to receive all collections
	wantedDids: [
        // "did:web:example.com"
    ], // omit to receive events from all dids
});





jetstream.onCreate("app.bsky.feed.post", (event) => {
    const text = event.commit.record.text;
    forEachTweet(text);
});

// jetstream.onDelete("app.bsky.feed.post", (event) => {
//     console.log(`Deleted post: ${event.commit.rkey}`)
// });

// Other events: 
// - "commit" (to receive all commits regardless of collection)
// - "identity" (identity update events)
// - `${collection}` (to receive all commits related to a specific collection)

// jetstream.on("account", (event) => {
//     console.log(`Account updated: ${event.did}`)
// });

jetstream.on("open", () => {
    console.log("open");
});

jetstream.on("close", () => {
    console.log("close");
    console.log(event);
});

jetstream.on("error", event => {
    console.log("error");
    console.log(event);
});

console.log("constructed");
jetstream.start();
console.log("started");


const tweetsToTrends = (tweets: string[]): string[] => {
    const prompt = "Given a list of tweets, identify 5 trends which are exemplified by multiple tweets in the list. If there are less than 5 recurring trends, complete the list with trends exemplified by a single tweet.";
    const schema = "{}"; // each trend should be its own field on an object, not a list. { trend1, trend2, trend3, trend4, trend5 }
    const results = [];
    // todo: call openai api
    return results;
}

const trendsToRecurringTrends = (trends: string[]): string[] => {
    const prompt = "A TrendList is a list of 10 trends. Given a list of 10 TrendLists, identify which trends, if any, recur in multiple TrendLists. The matches do not have to be exact and can be only similar.";
    const results = []; // each trend should be its own field
    return results;
}

const syntheticTweets = (tweets: string[]): string[] => {
    const prompt = "Given a list of 100 tweets, produce 10 new tweets in a similar style and with similar content to the original 100 tweets.";
    const schema = "";//each trend should be its own field
    const results = [];
    return results;
}

const getAndLogTrends = (tweets: string, time: Date) => { 
    const result = getTrendsFromTweets(tweets);
    redisClient.sAdd(`trends_${time.toISOString()}`, result.toString());//todo 
}
// TODO: tweets to trends every minute; recurring trends every 10 minutes; synthetic tweets every 10 minutes. Save synthetic tweets and send last 100 to UI.