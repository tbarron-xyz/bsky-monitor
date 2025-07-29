import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

const trendsSchema = z.object({
    trends: z.array( z.object({
        name: z.string()
    }) )
});

const summarySchema = z.object({
    summary: z.string()
});

const model = "gpt-4o-nano";

export class TrendsList {
    trends: {name:string}[]
}

export const getTrendsFromTweets = async (tweets: string): Promise<TrendsList> => {
    const prompt = `You are given a list of messages from a social media platform. Your task is to identify recurring trends or topics in the data.`; 
    // todo enforce json schema at api call level
    const response = await client.chat.completions.create({
        model: model,
        // instructions: 'You are a coding assistant that talks like a pirate',
        // input: 'Are semicolons optional in JavaScript?',
              messages: [
                { role: 'system', content: prompt},
                { role: 'user', content: tweets },
      ],
        response_format: zodResponseFormat(trendsSchema, "trends")
    }).then(x => x.choices[0].message.content as string);
    return trendsSchema.parse(response);
}

export const shortSummaryOfTweets = async (tweets: string): Promise<string> => {
    const politicalSentivityPhrase = `Do not use any language explicitly referring to any particular active military or political conflict; instead refer to the issue generally.`
    const prompt = `Produce a short (two to three sentences) text summary of what's going on in the following messages from a social platform.

    ${politicalSentivityPhrase}`;
    const response = await client.chat.completions.create({
        model: model,
        // instructions: 'You are a coding assistant that talks like a pirate',
        // input: 'Are semicolons optional in JavaScript?',
              messages: [
                { role: 'system', content: prompt},
                { role: 'user', content: tweets },
      ],
        response_format: zodResponseFormat(summarySchema, "summary")
    }).then(x => x.choices[0].message.content as string);
    return response;
}

// old functions contained hereon 

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