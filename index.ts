
import { TinyJetstream as Jetstream } from "mbjc/tinyjetstream";

import { add, redisClient, redisKeys, trim } from "./redisUtils.ts";
import { adPlaceholder, newsImg, newsImgGridClockwise, newsTopics } from './ai-apis.ts';

const jetstream = new Jetstream();

if (!await redisClient.get("fakeAdTime")) {
    adPlaceholder().then(x => {
        redisClient.set("fakeAd", x);
        redisClient.set("fakeAdTime", Date.now());
    });
}

if (!await redisClient.get("beatsTime")) {
    redisClient.lRange(redisKeys.messagesList, 0, 1500).then(tweets => {
        newsBeats(tweets).then(x => {
            redisClient.set("beats", JSON.stringify(x));
            redisClient.set("beatsTime", Date.now());
        });
    });
}

let lastIssueTime = parseInt(await redisClient.get("newsTopicsTime") || "0");
let counter = 0; // used for calling summarization every X tweets
const addToLastMessages = (tweet: string) => {
    add(redisKeys.messagesList, tweet);
    trim(redisKeys.messagesList, 0, 1500);
}



const addToTopics = (topics: string) => {
    add(redisKeys.news, topics);
    trim(redisKeys.news, 0, 4);
}

const addToNewsTime = (time: number) => {
    add("timeList", time.toString());
    trim("timeList", 0, 4);
}

const addToImgList = (img: Buffer<ArrayBuffer>) => {
    add("imgList", img);
    trim("imgList", 0, 4);
}

const addToImgGridList = (img: Buffer<ArrayBuffer>) => {
    add("imgGridList", img);
    trim("imgGridList", 0, 4);
}


jetstream.onTweet = (event) => {
    const text = event.commit.record.text;
    // sentimentAnalysisForEachTweet(text); // disabing manual sentiment analysis in favor of AI APIs for now
    addToLastMessages(text);
    const intervalHours = 3;
    if (Date.now() - lastIssueTime > intervalHours * 1000 * 60 * 60) {
        lastIssueTime = Date.now(); //temporarily setting the global var so that future message handlers won't also invoke
        redisClient.lRange(redisKeys.messagesList, 0, 1500).then(tweets => {
            console.log("Sending newsTopics API request.");
            newsTopics(/* subtopics! */"", tweets).then(x => {
                addToTopics(JSON.stringify(x));
                redisClient.set("newsTopics", JSON.stringify(x));
                const newTime = Date.now();
                redisClient.set("newsTopicsTime", newTime);
                lastIssueTime = newTime;
                addToNewsTime(Date.now());
                const z = x as any;
                newsImg(z.frontPageHeadline, z.frontPageParticle).then(img => {
                    addToImgList(img);
                    redisClient.set("img", img);
                    console.log("Saved img.");
                }, err => console.log(err));
                newsImgGridClockwise(z.topics).then(img => {
                    addToImgGridList(img);
                    console.log("saved grid img.");
                }, err => console.log(err));
            }, err => console.log(err));
        });
    }
    counter++;
    if (counter % 1000 == 0) console.log(counter);
};

console.log("constructed");
jetstream.start();
console.log("started");