import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});




export class TrendsList {
    trends: {name:string}[]
}

export const getTrendsFromTweets = (tweets: string): TrendsList => {
    const prompt = `You are given a list of messages from a social media platform. Your task is to identify recurring topics in the data.
    
    Your response format is to be as follows: TODO JSON Schema`; 
    // todo enforce json schema at api call level
    const result = { trends: [
            { name: "Solar energy"},
            { name: "Bacon shortage"}
        ]} as TrendsList; //todo actually call openapi api
    return result;
}

export const shortSummaryOfMessages = async (tweets: string): Promise<string> => {
    const politicalSentivityPhrase = `Do not use any language explicitly referring to ant particular active military or political conflict; instead refer to the issue generally.`
    const prompt = `Produce a short (two to three sentences) text summary of what's going on in the following messages from a social platform.

    ${politicalSentivityPhrase}`; //TODO enforce schema
    const result = "Everyone is in a buzz about the new iPhone release. Some discontent exists in United States politics.";//todo actual api call
    const response = await client.responses.create({
        model: 'gpt-4o',
        instructions: 'You are a coding assistant that talks like a pirate',
        input: 'Are semicolons optional in JavaScript?',
    });
    return result;
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