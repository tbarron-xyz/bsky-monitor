# bsky-monitor

A real-time social media monitoring and analysis system for Bluesky (formerly Twitter), focused on financial sentiment and trend analysis.

## Purpose

This project monitors Bluesky posts in real-time, analyzes sentiment related to S&P 500 companies, extracts trending topics, and generates AI-powered "newspapers" with articles and accompanying images. It provides insights into public sentiment and discussions around major corporations and financial markets.

Key features:
- Real-time monitoring of Bluesky posts using TinyJetstream
- Sentiment analysis for mentions of S&P 500 companies
- AI-powered summarization and trend extraction using OpenAI GPT
- Automated generation of news articles and images
- Redis-based data storage for mentions, sentiment scores, and generated content
- API endpoints for retrieving sentiment data and trends

## Project Structure

```
bsky-monitor/
├── index.ts                 # Main application entry point - sets up Bluesky monitoring
├── ai-apis.ts              # OpenAI API integrations for summarization, news generation, and image creation
├── sentiment-analysis.ts   # Sentiment analysis for S&P 500 company mentions
├── redisUtils.ts           # Redis database utilities and key definitions
├── serve-api.ts            # API functions for retrieving stored data
├── sp500_companies.csv     # S&P 500 company data for sentiment tracking
├── api_calls/              # Directory for generated content (news articles, images)
│   └── .gitignore
├── package.json            # Node.js dependencies and project metadata
├── package-lock.json       # Dependency lock file
└── oldindex.ts             # Legacy version of main file
```

## Dependencies

- **TinyJetstream (mbjc)**: For real-time Bluesky post streaming
- **OpenAI**: For AI-powered content generation and image creation
- **Redis**: For data storage and caching
- **Sentiment**: For basic sentiment analysis
- **Express**: For potential API serving (currently demo-only)
- **CSV-parse**: For parsing S&P 500 company data
- **Zod**: For response validation

## How It Works

1. **Monitoring**: Listens to Bluesky posts using TinyJetstream
2. **Sentiment Analysis**: Scans posts for S&P 500 company mentions and analyzes sentiment
3. **Data Storage**: Stores mentions, sentiment scores, and post content in Redis
4. **Trend Extraction**: Periodically summarizes recent posts and identifies trends
5. **News Generation**: Every 3 hours, generates a "newspaper" with front-page stories and topics
6. **Image Creation**: Uses AI to generate accompanying images for articles

## Usage

1. Set up Redis server
2. Configure OpenAI API key in environment variables
3. Run `npm install`
4. Execute `node index.ts` to start monitoring

Generated content is saved to the `api_calls/` directory, including news articles (JSON) and images (JPG).