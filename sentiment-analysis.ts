import * as fs from 'fs';

import { parse } from "csv-parse/sync";


import Sentiment from "sentiment";

import { redisKeys, redisClient , incrAndExpire} from "./redisUtils.ts";

const redisExpiries = {
    hours: 5 * 60 * 60 * 24, // 5 days
    days: 30 * 60 * 60 * 24 // 30 days
};
const sentiment = new Sentiment();

const fsfile = fs.readFileSync("./sp500_companies.csv");
const parser = parse(fsfile) as any[];
// csv column order is Exchange,Symbol,Shortname,Longname
const symbols = parser.filter((e,i) => i != 0).map(line => line[1]);
// const shortnames = parser.filter((e,i) => i != 0).map(line => line[2]).map(s => s.replace(/["]/g, '')) as string[]; // removes double quotes
const shortnames = parser.filter((e,i) => i != 0).map(line => line[3]).map(s => s.replace(/["]/g, '')) as string[]; // removes double quotes


const shortnameComponentsToRemove = [   // quick and dirty
 " Inc.", /, I$/,
 " Incorporated", " Incorporat", " Incorpora",  
 /Inc(\s+|$)/,  // inc followed by whitespace
 " Co.", " Company",
 " Ltd.", "Ltd",
 " plc.", " PLC", " plc",
 " Holdings", " (Holdin",
 " (The)",
 " Corporation", " Corporatio", " Corporati", " Corp", / Cor$/,
 /(?!^)International/,  //need to allow International Paper
 " Industries",
 " Limited",
 " Technologies", 
 " Solutions", 
 /,?\s*$/  // removes trailing commas and whitespace
];
const shortnamesMinusInc = shortnameComponentsToRemove.reduce((shortnamesTemp, component) => shortnamesTemp.map(x => x.replace(component, "")), shortnames);
// shornameComponentsToRemove.forEach(component => shortnamesMinusInc = shortnames)
// .filter(s => s.includes(" Inc."))
    // .map(s => s.replace(" Inc.", ""))
    // .map(s => s.replace("(The)", ""))
    // .map(s => s.replace(/,?\s*$/, ""))
    ;
// const shortnamesMinusInc = shortnames.filter(s => s.includes(", Inc.")).map(s => s.replace(" Inc.", ""));

const allTokenTargets = symbols as string[];
const allStringTargets = shortnamesMinusInc as string[];
console.dir(symbols.concat(allStringTargets), {maxArrayLength: null});


export const sentimentAnalysisForEachTweet = <T>(text: string) => {
   
   const sentimentResult = sentiment.analyze(text);
    const tokensFound = sentimentResult.tokens;//.map(x => x
        // .toUpperCase()
    // )
    const tokenTargetsFound = allTokenTargets.map((x,i) => [x,i,x,tokensFound.includes(x)]).filter(x => x[3]);
    // .filter(x => allTokenTargets.includes(x));
    const stringTargetsFound = allStringTargets.map((s,i) => [allTokenTargets[i],i,s,text.includes(s)]).filter(x => x[3]);
    const now = new Date();
    const nowString = now.toISOString();
    const currentDay = nowString.slice(0, 10);
    const currentHour = nowString.slice(11,13);
    const currentMinute = nowString.slice(14,16);
    // const currentSecond = new Date().toISOString().slice(17,19);
    if (tokenTargetsFound.length > 0 || stringTargetsFound.length > 0) {
        const tickers = tokenTargetsFound.concat(stringTargetsFound).map(x => x[0]) as string[];
        //increment redis keys
        (async () => {  // begin IIFE
            for (let ticker of tickers) {
                // tickers.forEach(ticker => {
                // add a sortedset entry
                const now = Date.now();
                redisClient.zAdd(redisKeys.mentionsSorted, [{score: Date.now(), value: `${ticker}_${now}`}]);
                redisClient.zAdd(redisKeys.sentimentSorted, [{score: Date.now(), value: `${ticker}_${sentimentResult.score}_${now}`}]);

                //increment daily counters
                //increment daily ticker mentions by 1
                await incrAndExpire(redisKeys.mentions, `${ticker}_${currentDay}`, 1, redisExpiries.days);
                // redisClient.hIncrBy(redisKeys.mentions, `${ticker}_${currentDay}`, 1);
                // redisClient.hExpire(redisKeys.mentions, )
    
                //increment daily ticker sentiment by sentiment
                await incrAndExpire(redisKeys.totalSentiment, `${ticker}_${currentDay}`, sentimentResult.score, redisExpiries.days);
                // redisClient.hIncrBy(redisKeys.totalSentiment, `${ticker}_${currentDay}`, sentimentResult.score);
    
                //increment hourly ^ ^^
                await incrAndExpire(redisKeys.mentions, `${ticker}_${currentDay}_${currentHour}`, 1, redisExpiries.hours);
                // redisClient.hIncrBy(redisKeys.mentions, `${ticker}_${currentDay}_${currentHour}`, 1);
                await incrAndExpire(redisKeys.totalSentiment, `${ticker}_${currentDay}_${currentHour}`, sentimentResult.score, redisExpiries.hours);
                // redisClient.hIncrBy(redisKeys.totalSentiment, `${ticker}_${currentDay}_${currentHour}`, sentimentResult.score);
    
                //increment minute ^ ^^
                // });
                }
        })(); // end IIFE


        console.log(`New post: ${text}`);
        console.log("includes: ", tokenTargetsFound.map(x => x[2]), stringTargetsFound.map(x => x[2]));
        console.log("Sentiment score: ", sentimentResult.score);
    }
}