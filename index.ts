
import { Jetstream } from "@skyware/jetstream";

import { add, redisClient, redisKeys, trim } from "./redisUtils.ts";
import { newsImg, newsTopics, shortSummaryOfTweets, subtopics, trendsFromSummaries } from './ai-apis.ts';
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
    trim(redisKeys.messagesList, 0, 1000);
}

const addToLastSummaries = (summary: string) => {
    add(redisKeys.messagesList, summary);
    trim(redisKeys.summariesList, 0, 100);
}

jetstream.onCreate("app.bsky.feed.post", (event) => {
    const text = event.commit.record.text;
    // sentimentAnalysisForEachTweet(text); // disabing manual sentiment analysis in favor of AI APIs for now
    addToLast100(text);
    const interval = 50000;
    if (counter % interval == 500) {
        // last 100 tweets -> subtopics ("news")
        // last 100 tweets -> summary
        // last 20 summaries -> trends
        // todo: last 20 trends -> long lived trends?
        // statistical sampling of 20 of the last 100 messages/summaries?
        if (false) { // disabling these calls for now to focus on newsTopics
            redisClient.lRange(redisKeys.messagesList, 0, 100).then(last100Tweets => {
                const last100TweetsConcat = last100Tweets.reduce((a,b) => `${a}\n${b}`);
                shortSummaryOfTweets(last100TweetsConcat).then(summaryResult => {
                    addToLastSummaries(summaryResult);
                    redisClient.set(redisKeys.currentSummary, summaryResult);
                    redisClient.lRange(redisKeys.summariesList, 0, 20).then(summaries => {
                        trendsFromSummaries(summaries).then(trends => {
                            redisClient.set(redisKeys.currentTrends, JSON.stringify(trends, null, 2));
                        })
                    });
                });
            });
            redisClient.lRange(redisKeys.messagesList, 0, 500).then(tweets => {
                subtopics(tweets).then(result => {
                    redisClient.set(redisKeys.subtopics, JSON.stringify(result, null, 2));
                });
                shortSummaryOfTweets(tweets.join("\n"), "Focus only on the Japanese language entries, but respond in English.");
            });
        }
    }
    if (counter % interval == 1000) { //every 100k, but slighly staggered
        redisClient.lRange(redisKeys.messagesList, 0, 900).then(tweets => {
            redisClient.get(redisKeys.subtopics).then(subtopics => 
                newsTopics(/* subtopics! */"", tweets).then(x => {
                    redisClient.set("newsTopics", JSON.stringify(x));
                    const z = x as any;
                    newsImg(z.frontPageHeadline, z.frontPageParticle).then(img => {
                        redisClient.set("img", img);
                        console.log("Saved img.");
                    });
            })
        )})
    }
    counter++;
    if (counter % 1000 == 0) console.log(counter);
});

jetstream.on("open", () => {
    console.log("open");
});

jetstream.on("close", () => {
    console.log("close");
});

jetstream.on("error", event => {
    console.log("error");
    console.log(event);
});

console.log("constructed");
jetstream.start();
console.log("started");

// TODO: activate tweets to trends every minute; recurring trends every 10 minutes; synthetic tweets every 10 minutes. Save synthetic tweets and send last 100 to UI.
