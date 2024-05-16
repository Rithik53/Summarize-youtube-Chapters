# YouTube Transcript Summarizer

This project fetches, caches, and summarizes transcripts from YouTube videos. It uses the OpenAI API to generate summaries and organizes them into labeled chapters.

## Features

- Fetches transcripts for YouTube videos
- Caches transcripts locally
- Summarizes transcripts into labeled chapters using OpenAI GPT-4
- Handles errors and retries fetching transcripts

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Rithik53/Summarize-youtube-Chapters.git
    cd Summarize-youtube-Chapters
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables:

   Create a `.env` file in the root directory and add your OpenAI API organization ID and API key:
    ```env
    OPENAI_API_ORGID=your-openai-api-orgid
    OPENAI_API_KEY=your-openai-api-key
    ```

## Usage

1. Run the script with the YouTube video ID as an argument:
    ```bash
    node index.js <videoId>
    ```
   Replace `<videoId>` with the actual ID of the YouTube video you want to process.

2. The script will ensure the necessary directories are created, fetch the transcript for the specified YouTube video ID, cache it locally, and then summarize it.

## Directory Structure

- `./transcripts`: Directory to cache downloaded transcripts.
- `./completions`: Directory to store summary completions from OpenAI.

## Environment Variables

- `OPENAI_API_ORGID`: Your OpenAI API organization ID.
- `OPENAI_API_KEY`: Your OpenAI API key.

## Functions

### `ensureDirectories()`

Ensures that the directories for caching transcripts and storing completions exist. If they do not, it creates them.

### `fetchTranscriptUrl(videoId)`

Fetches the URL for the transcript of a YouTube video.

### `downloadTranscript(url)`

Downloads and parses the transcript from the provided URL.

### `cacheTranscript(videoId, transcriptText)`

Caches the transcript text locally.

### `getTranscript(videoId)`

Gets the transcript for the specified YouTube video ID, either from the cache or by fetching and downloading it.

### `summarizeTranscript({ id, text })`

Summarizes the transcript text into labeled chapters using the OpenAI API.

### `main()`

Main function to get the transcript and summarize it for a specified YouTube video ID.

## Limitations

- **Transcript Length**: A 7-hour video can produce a transcript with approximately 60,000 tokens.
- **OpenAI GPT-4 Token Limit**: The GPT-4 model can handle only up to ~8,000 tokens, which corresponds to about a 20-minute video. This means that for longer videos, the transcript needs to be divided into smaller chunks before summarization.

## Example

To summarize the transcript for a YouTube video with ID `DQacCB9tDaw`, run the following command:
```bash
node index.js DQacCB9tDaw
