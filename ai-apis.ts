import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { promises as fs } from 'fs';

const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

const savePrefix = "./api_calls/";

const model = "gpt-5-nano";
// const model = "gpt-4.1-nano";




const newsTopicsSchema = z.object({
    frontPageHeadline: z.string(),
    frontPageArticle: z.string(),
    topics: z.array(z.object({
        name: z.string(),
        headline: z.string(),
        newsStoryFirstParagraph: z.string(),
        newsStorySecondParagraph: z.string(),
        oneLineSummary: z.string(),
        supportingSocialMediaMessage: z.string(),
        skepticalComment: z.string(),
        gullibleComment: z.string(),
    })),
    modelFeedbackAboutThePrompt: z.object({positive: z.string(), negative: z.string()}), 
    newspaperName: z.string(),

});

export const newsTopics = async (subtopics: string, tweets: string[]): Promise<{}> => {
    const prompt = `You are given a list of trends, and a list of social media messages. From those messages, identify one primary newsworthy story that would be suitable as the primary cover story of a newspaper; write a headline and the first paragraph of that cover story. Then identify exactly 5 more newsworthy stories. Make sure there are at least five, and no less! Write a headline for each story in the style of a print newspaper from the early 20th century. Furthermore, for each story, generate the first and second paragraphs of an enthusiastically written news story focusing on that topic in a traditional understated evening news style. Utilize facts and opinions drawn from the provided social media messages when writing the news story, while also providing a fact or two from pre-existing knowledge about the topic. Each paragraph should be at least four sentences long. Include at least one social media message from among those provided which supports the story - this should be provided directly, without quotes around it or any commentary on it. Also include two generated comments on each news story, one of which is very skeptical and conspiratorial, and one of which is very gullible and patriotic; the tone of these comments should match that of the provided social media messages. Also create a clever name for the newspaper based on the news stories and style, and based on the fact that these stories were derived through analysis of social media posts, but without using the word "Bluesky".
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
            if (!x) return {};
            const value = x.choices[0].message.content as string;
            const jValue = newsTopicsSchema.parse(JSON.parse(value));
            console.log(`Your hard-earned dollars paid for this OpenAI API response: `);
            console.log(jValue);
            console.log(`${x.usage?.prompt_tokens} input, ${x.usage?.completion_tokens} output`);
            fs.writeFile(`${savePrefix}news.${((x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}.${x.getHours()}-${x.getMinutes()}.txt`)(new Date())}`, JSON.stringify(jValue)).then(()=>{});
            return jValue;
        } catch (e) {
            return {};
        }
    });
    return response;
}


export const newsImg = async (headline: string, body: string) => {
    const prompt = `Create an image to accompany the following newspaper article. The style should be photorealistic, like a real photo from a physical camera; not hand-drawn. There should not be any text visible in the image. The image should not be a grid of smaller images; it should be one single image. The image should not contain graphic depictions of people or children suffering from starvation or malnutrition.
    
    ---
    ${headline}
    ---
    ${body}`;

    const result = await client.images.generate({
        model: "gpt-image-1",
        quality: "low",
        size: "1024x1024",
        prompt,
    });


    // Save the image to a file
    const image_base64 = result.data![0].b64_json!;
    const image_bytes = Buffer.from(image_base64, "base64");
    fs.writeFile(`${savePrefix}img.${((x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}.${x.getHours()}-${x.getMinutes()}.jpg`)(new Date())}`, image_bytes).then(()=>{});
    return image_bytes;
}

export const newsImgGridClockwise = async (stories: {headline: string, oneLineSummary: string}[]) => {
    const prompt = `Generate a square grid of four images to accompany four news articles. The style should be photorealistic, like real photos from a physical camera; not hand-drawn. There should not be any text visible in the image. The grid images should be, in clockwise order starting from the top left:
    
    ${stories.slice(0,4).map((story,i)=> `${i}. "${story.headline}" - ${story.oneLineSummary}\n`)}`;

    const result = await client.images.generate({
        model: "gpt-image-1",
        quality: "low",
        size: "1024x1024",
        prompt,
    });


    // Save the image to a file
    const image_base64 = result.data![0].b64_json!;
    const image_bytes = Buffer.from(image_base64, "base64");
    fs.writeFile(`${savePrefix}imggrid.${((x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}.${x.getHours()}-${x.getMinutes()}.jpg`)(new Date())}`, image_bytes).then(()=>{});
    return image_bytes;
}

export const adPlaceholder = async () => {
    console.log("Sending API request for adPlaceholder");
    const prompt = `Generate an image that's vertically split in half. On each half should be a typical web banner ad, in vertical orientation. Use tropes and styles that were typical of web banner ads from the 2000s and 2010s, particularly annoying, scammy ads and popups.`;

    const result = await client.images.generate({
        model: "gpt-image-1",
        quality: "low",
        size: "1024x1024",
        prompt,
    });


    // Save the image to a file
    const image_base64 = result.data![0].b64_json!;
    const image_bytes = Buffer.from(image_base64, "base64");
    fs.writeFile(`${savePrefix}fakead.${((x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}.${x.getHours()}-${x.getMinutes()}.jpg`)(new Date())}`, image_bytes).then(()=>{});
    return image_bytes;
}
