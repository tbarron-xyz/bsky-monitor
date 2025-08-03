
import { Jetstream } from "@skyware/jetstream";

import { add, redisClient, redisKeys, trim } from "./redisUtils.ts";
import { getTrendsFromTweets, shortSummaryOfTweets, subtopics, trendsFromSummaries } from './ai-apis.ts';
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
const addToLast100 = (tweet: string) => {
    add(redisKeys.messagesList, tweet);
    trim(redisKeys.messagesList, 0, 100);
}

const addToLastSummaries = (summary: string) => {
    add(redisKeys.messagesList, summary);
    trim(redisKeys.summariesList, 0, 100);
}

jetstream.onCreate("app.bsky.feed.post", (event) => {
    const text = event.commit.record.text;
    // sentimentAnalysisForEachTweet(text); // disabing for now
    addToLast100(text);
    // add(redisKeys.messagesList, text);
    // trim(redisKeys.messagesList, 0, 100);
    if (counter % 1000 == 0) {
        // const last100 = 
        redisClient.lRange(redisKeys.messagesList, 0, 100).then(last100Tweets => {
            const last100TweetsConcat = last100Tweets.reduce((a,b) => `${a}\n${b}`);//todo get from redis
            shortSummaryOfTweets(last100TweetsConcat).then(result => {
                addToLastSummaries(result);
                redisClient.set(redisKeys.currentSummary, result);
                redisClient.lRange(redisKeys.summariesList, 0, 100).then(summaries => {
                    trendsFromSummaries(summaries).then(trends => {
                    redisClient.set(redisKeys.currentTrends, JSON.stringify(trends, null, 2));
                    })
                });
            });
            subtopics(last100Tweets).then(result => {
                redisClient.set(redisKeys.subtopics, JSON.stringify(result, null, 2));
                // console.log(result);
            });
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
