import express from "express";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo } from "./storage"

setupDirectories();

const app = express();

// Tells the app that we're working with JSON data
app.use(express.json())

// We will get a POST request from Pub/Sub message from GCS; refer to that documentation to know why we're handling things this way
app.post("/process-video", async (req: any, res: any) => {
  let data;
  try {
    const message = Buffer.from(req.body.message.data, "base64").toString("utf8");
    data = JSON.parse(message);
    if (!data.name) {
      throw new Error("Invalid message payload received.")
    }
  } catch (error) {
    console.error(error);
    return res.status(400).send("Bad request: missing filename.")
  }

  // Get filename from Pub/Sub message
  const inputFileName = data.name;
  const outputFileName = `processed-${inputFileName}`;

  // Download raw video from cloud 
  await downloadRawVideo(inputFileName);

  try {
    await convertVideo(inputFileName, outputFileName);
  } catch (err) {
    // Upon failing, we might have partially created video files, or at the very least our now purposeless input files
    // Clean them up!
    // NOTE: Using Promise.all like this makes both of these await in parallel, not one after the other
    await Promise.all([
      await deleteRawVideo(inputFileName),
      await deleteProcessedVideo(outputFileName)
    ])

    console.error(err);

    return res.status(500).send("Internal server error: video processing failed");
  }

  // Upload processed video
  await uploadProcessedVideo(outputFileName);

  // After it's done, clean up
  await Promise.all([
    await deleteRawVideo(inputFileName),
    await deleteProcessedVideo(outputFileName)
  ])

  return res.status(200).send("Processing finished successfully!");
});

// Use environment-defined port; fallback to 3000 if none is defined
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Video processing service listening at http://localhost:${port}`);
})
