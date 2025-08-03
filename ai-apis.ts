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

const subtopicsSchema = z.object({
    politics: z.array( z.object({
        name: z.string()
    }) ),
    finance : z.array( z.object({
        name: z.string()
    }) ),
    culture: z.array( z.object({
        name: z.string()
    }) ),
    food: z.array( z.object({
        name: z.string()
    }) ),
    technology: z.array( z.object({
        name: z.string()
    }) ),
});


const summarySchema = z.object({
    summary: z.string()
});

const model = "gpt-4.1-nano";

export class TrendsList {
    trends: {name:string}[]
}

export const getTrendsFromTweets = async (tweets: string): Promise<TrendsList> => {
    const prompt = `You are given a list of messages from a social media platform. Your task is to identify recurring trends or topics in the data. Just talk about the trends`; 
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
    console.log(`API Response: ${response}`);
    return trendsSchema.parse(response);
}

export const shortSummaryOfTweets = async (tweets: string): Promise<string> => {
    const politicalSentivityPhrase = "";//`Do not use any language explicitly referring to any particular active military or political conflict; instead refer to the issue generally.`

    const prompt = `Produce a short (two to three sentences) text summary of what's going on in the following messages from a social platform. Don't refer to the messages per se; just refer to the topics or subjects or moods contained therein. Make it sound as if you're writing abstractly of these things, without having summarized them from a list of messages. Do not use the phrase "the messages". Make sure to refer to at least two specific examples of concrete topics.

    ${politicalSentivityPhrase}
    `;
    const response = await client.chat.completions.create({
        model: model,
              messages: [
                { role: 'system', content: prompt},
                { role: 'user', content: tweets },
      ],
        response_format: zodResponseFormat(summarySchema, "summary")
    }).then(x => {
        const value = x.choices[0].message.content as string;
        const jValue = summarySchema.parse(JSON.parse(value));
        console.log(`Your hard-earned dollars paid for this OpenAI API response: `);
        console.log(jValue);
        return jValue.summary;
    });
    return response;
}

export const trendsFromSummaries = async (summaries: string[]): Promise<string[]> => {
    const prompt = "You are given a list of summaries of conversations. Your job is to identify at least 5 trends and topics which occur multiple times across multiple summaries. The matches do not have to be exact and can be only roughly similar.";
    

    const response = await client.chat.completions.create({
        model: model,
        messages: [
        { role: 'system', content: prompt},
        { role: 'user', content: summaries.join("\n") },
      ],
        response_format: zodResponseFormat(trendsSchema, "trends")
    }).then(x => {
        const value = x.choices[0].message.content as string;
        const jValue = trendsSchema.parse(JSON.parse(value));
        console.log(`Your hard-earned dollars paid for this OpenAI API response: `);
        console.log(jValue);
        return jValue.trends.map(x => x.name);
    });
    return response;
}

export const subtopics = async (tweets: string[]): Promise<{}> => {
    const politicalSentivityPhrase = "";//`Do not use any language explicitly referring to any particular active military or political conflict; instead refer to the issue generally.`

    const prompt = `You are given a list of messages from social media. What are some specific political topics being discussed? What are some specific financial topics being discussed? What are some specific elements of arts and culture being discussed? What are some specific elements of food being discussed? What are some specific topics in technology being discussed?

    ${politicalSentivityPhrase}
    `;
    // console.log("Sending subtopics request");
    const response = await client.chat.completions.create({
        model: model,
        messages: [
            { role: 'system', content: prompt},
            { role: 'user', content: tweets.join("\n") },
        ],
        response_format: zodResponseFormat(subtopicsSchema, "subtopics")
    }).then(x => {
        try {
            const value = x.choices[0].message.content as string;
            const jValue = subtopicsSchema.parse(JSON.parse(value));
            console.log(`Your hard-earned dollars paid for this OpenAI API response: `);
            console.log(jValue);
            return jValue;
        } catch (e) {
            return {};
        }
    });
    return response;
}

export const recurringSubtopics = async (tweets: string[]): Promise<{}> => {
    const politicalSentivityPhrase = "";//`Do not use any language explicitly referring to any particular active military or political conflict; instead refer to the issue generally.`

    const prompt = `You are given a list of messages from social media. What are some specific political topics being discussed? What are some specific financial topics being discussed? What are some specific elements of arts and culture being discussed? What are some specific elements of food being discussed? What are some specific topics in technology being discussed?

    ${politicalSentivityPhrase}
    `;
    // console.log("Sending subtopics request");
    const response = await client.chat.completions.create({
        model: model,
        messages: [
            { role: 'system', content: prompt},
            { role: 'user', content: tweets.join("\n") },
        ],
        response_format: zodResponseFormat(subtopicsSchema, "subtopics")
    }).then(x => {
        try {
            const value = x.choices[0].message.content as string;
            const jValue = subtopicsSchema.parse(JSON.parse(value));
            console.log(`Your hard-earned dollars paid for this OpenAI API response: `);
            console.log(jValue);
            return jValue;
        } catch (e) {
            return {};
        }
    });
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