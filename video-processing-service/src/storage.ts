// This file will:
// 1. Handle Google Cloud storage interactions
// 2. Local file interactions

// Will upload videos to raw bucket
// These will then be processed and placed in the processed bucket

import { Storage } from '@google-cloud/storage'; // {} is a named import; we're importing something that something else exporteed by name
import ffmpeg from "fluent-ffmpeg" // This is CLI tool that wraps ffmpeg; need to install ffmpeg locally too
import fs from "fs";
  
const storage = new Storage();

// GCS global bucket names must be unique!
const rawVideoBucketName = "rnieb-raw-videos";
const processedVideoBucketName = "rnieb-processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./raw-videos";

// `export` keyword allows us to use this function from this module elsewhere

/** Create local directories for raw and processed videos */
export function setupDirectories(){
  ensureDirectoryExistence(localRawVideoPath);
  ensureDirectoryExistence(localProcessedVideoPath);
}

export function convertVideo(rawVideoName: string, processedVideoName: string){
  // A JS promise either resolves or rejects, depending on whether our code succeeded or failed
  // We resolve with value, so we need to give back something on resolution
  return new Promise<void>((resolve, reject) => {
    // Run ffmpeg on input file 
    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
      .outputOptions("-vf", "scale=-1:360") // Give args to ffmpeg; here we convert to 360p
      // This runs when we're done processing
      .on("end", () => {
        console.log("Processing finished successfully!") 
        resolve();
      })
      // This runs if we have any errors
      .on("error", (err) => {
        console.error(`Error: ${err.message}`)
        reject(err);
      })
      // If everything works, save output file to path
      .save(`${localProcessedVideoPath}/${processedVideoName}`);
  })
}

// async functions return promises implicitly and enables us to `await`
// `await` pauses function execution until the promise is resolved without blocking program flow
// TODO: Read more about this async programming model!

/** Download video from bucket */
export async function downloadRawVideo(fileName: string){
  // Hook up to cloud bucket and download file to destination
  // `await` lets us do this in the BG!
  await storage.bucket(rawVideoBucketName)
  .file(fileName)
  .download({destination: `${localRawVideoPath}/${fileName}`}) // This is a JS object, which is kind of like a dict and is pretty related to JSON!

  // GCS storage buckets are prefixed with gs://
  console.log(
    `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.`
  );
}

/** Upload video to bucket */
export async function uploadProcessedVideo(fileName: string){
  const bucket = storage.bucket(processedVideoBucketName);
  
  await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
    destination: fileName
  });

  console.log(
    `${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}`
  )

  await bucket.file(fileName).makePublic(); 
}

/** For cleanup; deletes raw video locally */
export function deleteRawVideo(fileName: string) {
  return deleteFile(`${localRawVideoPath}/${fileName}`);
}

/** For cleanup; deletes processed video from local */
export function deleteProcessedVideo(fileName: string){
  return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

/** Deletion of files for cleanup */
function deleteFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Perform deletion if filepath exists; if not, skip deletion
    if (fs.existsSync(filePath)){
      fs.unlink(filePath, (err) => {
        if (err){
          console.log(`Failed to delete file at ${filePath}`, err)
          reject(err);
        } else {
          console.log(`File deleted at ${filePath}`);
          resolve();
        }
      })
    } else {
      console.log(`File not found at ${filePath}, skipping deletion`)
      resolve();
    }
  });
}

/** Checks if dir exists; if not, it creates one */
function ensureDirectoryExistence(dirPath: string){
  if (!fs.existsSync(dirPath)){
    fs.mkdirSync(dirPath, {recursive: true});
    console.log(`Directory created at ${dirPath}`);
  }
}
