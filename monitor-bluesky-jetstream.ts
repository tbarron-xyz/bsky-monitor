
import { Jetstream } from "@skyware/jetstream";

import { redisClient, redisKeys } from "./redisUtils.ts";
import { getTrendsFromTweets, shortSummaryOfTweets } from './ai-apis.ts';
import { sentimentAnalysisForEachTweet } from './sentiment-analysis.ts';

const jetstream = new Jetstream({
	wantedCollections: ["app.bsky.feed.post",
        //  "app.bsky.feed.like"
        ], // omit to receive all collections
	wantedDids: [
        // "did:web:example.com"
    ], // omit to receive events from all dids
});

let counter = 0; // used for calling summarization every X tweets
const last100Tweets: string[] = []; // todo use redis
const addToLast100 = (tweet: string) => {
    if (last100Tweets.length > 100) { last100Tweets.shift(); }
    last100Tweets.push(tweet);
}

jetstream.onCreate("app.bsky.feed.post", (event) => {
    const text = event.commit.record.text;
    sentimentAnalysisForEachTweet(text);
    addToLast100(text);
    if (counter % 100 == 0) {
        const last100TweetsConcat = last100Tweets.reduce((a,b) => `${a}${b}`);//todo get from redis
        shortSummaryOfTweets(last100TweetsConcat).then(result => {
            redisClient.set(redisKeys.currentSummary, result);
        });
        getTrendsFromTweets(last100TweetsConcat).then(result => {
            redisClient.set(redisKeys.currentTrends, JSON.stringify(result));
        });
    }
    counter++;
});

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

// TODO: activate tweets to trends every minute; recurring trends every 10 minutes; synthetic tweets every 10 minutes. Save synthetic tweets and send last 100 to UI.
