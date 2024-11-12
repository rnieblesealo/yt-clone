import express from "express";
import ffmpeg from "fluent-ffmpeg" // This is CLI tool that wraps ffmpeg; need to install ffmpeg locally too

const app = express();

// Tells the app that we're working with JSON data
app.use(express.json())

app.post("/process-video", (req, res) => {
  const inputFilePath = req.body.inputFilePath;
  const outputFilePath = req.body.outputFilePath;

  // Validate input request has what we need
  if (!inputFilePath || !outputFilePath) {
    res.status(400).send("Bad request: Missing file path")
  }

  // Run ffmpeg on input file 
  ffmpeg(inputFilePath)
    .outputOptions("-vf", "scale=-1:360") // Give args to ffmpeg; here we convert to 360p
    // This runs when we're done processing
    .on("end", () => {
      res.status(200).send("Processing finished successfully!") })
    // This runs if we have any errors
    .on("error", (err) => {
      console.error(`Error: ${err.message}`)
      res.status(500).send(`Internal server error: ${err.message}`)
    })
    // If everything works, save output file to path
    .save(outputFilePath);
});

// Use environment-defined port; fallback to 3000 if none is defined
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Video processing service listening at http://localhost:${port}`);
})
