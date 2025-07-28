
import { Jetstream } from "@skyware/jetstream";

import { redisClient } from "./redisUtils.ts";
import { getTrendsFromTweets, shortSummaryOfMessages } from './ai-apis.ts';
import { forEachTweet } from './sentiment-analysis.ts';

const jetstream = new Jetstream({
	wantedCollections: ["app.bsky.feed.post",
        //  "app.bsky.feed.like"
        ], // omit to receive all collections
	wantedDids: [
        // "did:web:example.com"
    ], // omit to receive events from all dids
});



let counter = 0; // used for calling summarization every X tweets

jetstream.onCreate("app.bsky.feed.post", (event) => {
    const text = event.commit.record.text;
    forEachTweet(text);
    if (counter % 100 == 0) {
        const last100TweetsConcat = "";//todo get from redis
        shortSummaryOfMessages(last100TweetsConcat).then(result => {
            //todo store result in db
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


const getAndLogTrends = (tweets: string, time: Date) => { 
    const result = getTrendsFromTweets(tweets);
    redisClient.sAdd(`trends_${time.toISOString()}`, result.toString());//todo 
}

const getLatestTrendsFromStorage = () => {
    return //todo redisclient.sGetLatest(key)
}
// TODO: activate tweets to trends every minute; recurring trends every 10 minutes; synthetic tweets every 10 minutes. Save synthetic tweets and send last 100 to UI.