import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { minLength } from 'zod/v4';

const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

const trendsSchema = z.object({
    trends: z.array( z.object({
        name: z.string(),
        oneLineSummary: z.string()
    }) )
});



const model = "gpt-4.1-nano";

export class TrendsList {
    trends: {name:string}[]
}

export const getTrendsFromTweets = async (tweets: string): Promise<TrendsList> => {
    const prompt = `You are given a list of messages from a social media platform. Your task is to identify recurring trends or topics in the data. Just talk about the trends`; 
    const response = await client.chat.completions.create({
        model: model,
        messages: [
            { role: 'system', content: prompt},
            { role: 'user', content: tweets },
        ],
        response_format: zodResponseFormat(trendsSchema, "trends")
    }).then(x => x.choices[0].message.content as string);
    console.log(`API Response: ${response}`);
    return trendsSchema.parse(response);
}


const summarySchema = z.object({
    summary: z.string(),
});


export const shortSummaryOfTweets = async (tweets: string, prefix?: string): Promise<string> => {
    const politicalSentivityPhrase = "";//`Do not use any language explicitly referring to any particular active military or political conflict; instead refer to the issue generally.`

    const prompt = `${prefix}Produce a short (two to three sentences) text summary of what's going on in the following messages from a social platform. Don't refer to the messages per se; just refer to the topics or subjects or moods contained therein. Make it sound as if you're writing abstractly of these things, without having summarized them from a list of messages. Do not use the phrase "the messages" or anything similar, just refer to the topics. Make sure to refer to at least two specific examples of concrete topics.

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
    const prompt = "You are given a list of information. Your job is to identify at least 5 trends and topics which occur multiple times across multiple entries. The matches do not have to be exact and can be only roughly similar. You are allowed at most *one* entry that mentions the topic 'AI'.";
    

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

const topic = z.object({
        name: z.string(),
        oneLineSummary: z.string(),
    }) ;

const subtopicsSchema = z.object({
    politics: z.array( topic),
    finance : z.array( topic),
    culture: z.array( topic),
    food: z.array( topic),
    technology: z.array( topic ),
});


export const subtopics = async (tweets: string[]): Promise<{}> => {
    const politicalSentivityPhrase = "";//`Do not use any language explicitly referring to any particular active military or political conflict; instead refer to the issue generally.`

    const prompt = `You are given a list of messages from social media. What are some specific political topics being discussed? What are some specific financial topics being discussed? What are some specific elements of arts and culture being discussed? What are some specific elements of food being discussed? What are some specific topics in technology being discussed? Name at most three of each. Focus on topics that have international significance, not personal discussions or local happenings. And you can include at *most* one instance of the term "AI" - having multiple AI listing is not allowed.

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

export const recurringSubtopics = async (subtopics: string[]): Promise<{}> => {
    const politicalSentivityPhrase = "";//`Do not use any language explicitly referring to any particular active military or political conflict; instead refer to the issue generally.`

    const prompt = `You are given a list of topics, in json format. Your job is to identify which of these topics occurs the most frequently. The topic name match does not have to be exact, but should represent a similar subject. Return at most 5 topics.
    ${politicalSentivityPhrase}`;
    // console.log("Sending subtopics request");
    const response = await client.chat.completions.create({
        model: model,
        messages: [
            { role: 'system', content: prompt},
            { role: 'user', content: subtopics.join("\n") },
        ],
        response_format: zodResponseFormat(trendsSchema, "recurringSubtopics")
    }).then(x => {
        try {
            const value = x.choices[0].message.content as string;
            const jValue = newsTopicsSchema.parse(JSON.parse(value));
            console.log(`Your hard-earned dollars paid for this OpenAI API response: `);
            console.log(jValue);
            return jValue;
        } catch (e) {
            return {};
        }
    });
    return response;
}


const newsTopicsSchema = z.object({
    topics: z.array(z.object({
        name: z.string(),
        headline: z.string(),
        newsStoryFirstParagraph: z.string(),
        newsStorySecondParagraph: z.string(),
        supportingSocialMediaMessage: z.string(),
        skepticalComment: z.string(),
        gullibleComment: z.string(),
    })),
     modelFeedbackAboutThePrompt: z.object({positive: z.string(), negative: z.string()}), 
    newspaperName: z.string(),
    frontPageHeadline: z.string(),
    frontPageArticle: z.string()
});

export const newsTopics = async (subtopics: string, tweets: string[]): Promise<{}> => {
        const prompt = `You are given a list of trends, and a list of social media messages. From those messages, identify at least 5 newsworthy stories. Make sure there are at least five, and no less! Write a headline for each story in the style of a print newspaper from the early 20th century. Furthermore, for each story, generate the first and second paragraphs of an enthusiastically written news story focusing on that topic in a traditional understated evening news style. Utilize facts and opinions drawn from the provided social media messages when writing the news story, while also providing a fact or two from pre-existing knowledge about the topic. Each paragraph should be at least four sentences long. Include at least one social media message from among those provided which supports the story - this should be provided directly, without quotes around it or any commentary on it. Also include two generated comments on each news story, one of which is very skeptical and conspiratorial, and one of which is very gullible and patriotic. Also create a name for the newspaper based on the news stories and style. Then, to top it all off, choose a final lighthearted topic (or an aggregate of multiple topics) on which to write an invigorating headline and accompanying article for the front page that will make it impossible for readers to look away.
    `;
    // console.log("Sending subtopics request");
    const response = await client.chat.completions.create({
        model: model,
        messages: [
            { role: 'system', content: prompt},
            { role: 'user', content: `Trends: ${subtopics}\n\nSocial media messages: ${tweets.join("\n")}` },
        ],
        response_format: zodResponseFormat(newsTopicsSchema, "topics")
    }).then(x => {
        try {
            const value = x.choices[0].message.content as string;
            const jValue = newsTopicsSchema.parse(JSON.parse(value));
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