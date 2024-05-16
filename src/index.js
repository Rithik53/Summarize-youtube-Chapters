import { Configuration, OpenAIApi } from "openai";
import axios from "axios";
import cheerio from "cheerio";
import fs from "fs/promises";
import dotenv from 'dotenv';

dotenv.config();

// Check for required environment variables
if (!process.env.OPENAI_API_ORGID || !process.env.OPENAI_API_KEY) {
  console.error("Error: Missing required environment variables. Please set OPENAI_API_ORGID and OPENAI_API_KEY.");
  process.exit(1);
}

const configuration = new Configuration({
  organization: process.env.OPENAI_API_ORGID,
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const IGNORE_LIST = ["[Music]", "foreign"];
const TRANSCRIPT_CACHE_DIR = "./transcripts";
const COMPLETIONS_DIR = "./completions";

function parseHtmlEntities(str) {
  return str.replace(/&#([0-9]{1,3});/gi, (_, numStr) => String.fromCharCode(parseInt(numStr, 10)));
}

function padNumber(value) {
  return value.toString().padStart(2, "0");
}

async function fetchTranscriptUrl(videoId) {
  try {
    const { data: html } = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
    const match = html.match(/playerCaptionsTracklistRenderer":\{"captionTracks":\[\{"baseUrl":"(.*?)",/);
    if (match) {
      return match[1].replaceAll("\\u0026", "&");
    }
  } catch (error) {
    console.error(`Failed to fetch transcript URL for video ${videoId}: ${error.message}`);
  }
  return null;
}

async function downloadTranscript(url) {
  try {
    const { data: xml } = await axios.get(url);
    const $ = cheerio.load(xml);
    let transcriptText = "";
    $("transcript text").each((i, el) => {
      const $el = $(el);
      const text = parseHtmlEntities($el.text());
      if (!IGNORE_LIST.includes(text)) {
        const start = Number($el.attr("start"));
        const seconds = Math.floor(start % 60);
        const minutes = Math.floor((start / 60) % 60);
        const hours = Math.floor(start / 3600);
        const timestamp = [hours, minutes, seconds].map(padNumber).join(":");
        transcriptText += `${timestamp}\n${text}\n`;
      }
    });
    return transcriptText;
  } catch (error) {
    console.error(`Failed to download transcript: ${error.message}`);
  }
  return '';
}

async function cacheTranscript(videoId, transcriptText) {
  try {
    await fs.writeFile(`${TRANSCRIPT_CACHE_DIR}/${videoId}.txt`, transcriptText, "utf-8");
  } catch (error) {
    console.error(`Failed to cache transcript for video ${videoId}: ${error.message}`);
  }
}

async function getTranscript(videoId) {
  try {
    const cachePath = `${TRANSCRIPT_CACHE_DIR}/${videoId}.txt`;
    try {
      const cachedTranscript = await fs.readFile(cachePath, "utf-8");
      return { text: cachedTranscript, id: videoId };
    } catch {
      console.log(`No cached transcript found for video ${videoId}. Fetching...`);
    }

    const transcriptUrl = await fetchTranscriptUrl(videoId);
    if (transcriptUrl) {
      const transcriptText = await downloadTranscript(transcriptUrl);
      if (transcriptText) {
        await cacheTranscript(videoId, transcriptText);
        return { text: transcriptText, id: videoId };
      }
    }
  } catch (error) {
    console.error(`Failed to get transcript for video ${videoId}: ${error.message}`);
  }
  return { text: '', id: videoId };
}

async function summarizeTranscript({ id, text }) {
  if (!text) return;
  try {
    const { data, headers } = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You create labeled chapters for YouTube videos about Programming from the YouTube channel. The host of the show is dev and should be referenced by name when needed. The transcript you will be given has a timestamp on one line and the next line is the corresponding text for that timestamp. This repeats for the whole transcript. The output should be each timestamp and chapter title on a newline. Each chapter title should be no longer than 50 characters. The chapter titles can be keywords, summarized concepts, or titles. Only create a new chapter when the topic changes significantly. At least 2 minutes should have elapsed before specifying a new chapter. Only use the timestamps specified in the transcript. The chapter timestamps should not be greater than the largest timestamp in the transcript. The output for each line should look like: 00:00:00 Title`
        },
        { role: "user", content: `Summarize the following transcript:\n${text}` },
      ],
    });

    const completionPath = `${COMPLETIONS_DIR}/${Date.now()}-${id}.json`;
    await fs.writeFile(completionPath, JSON.stringify({ data, headers }, null, 2), 'utf-8');
    console.log(`Summary written to ${completionPath}`);
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(`OpenAI API error: ${error.response.data}`);
    } else {
      console.error(`Failed to summarize transcript: ${error.message}`);
    }
  }
}

async function ensureDirectories() {
  try {
    await fs.mkdir(TRANSCRIPT_CACHE_DIR, { recursive: true });
    await fs.mkdir(COMPLETIONS_DIR, { recursive: true });
    console.log("Directories ensured.");
  } catch (error) {
    console.error(`Failed to create directories: ${error.message}`);
    process.exit(1);
  }
}

ensureDirectories().then(() => {
  main("DQacCB9tDaw");
});
