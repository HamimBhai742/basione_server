import axios from "axios";

async function main() {
  const url = "https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/mockups/1785585208465-mockup.png";
  try {
    console.log("Downloading metadata...");
    const response = await axios.get(url, { responseType: "stream" });
    const length = response.headers["content-length"];
    if (length) {
      console.log(`Content-Length: ${length} bytes (${(parseInt(length) / (1024 * 1024)).toFixed(2)} MB)`);
    } else {
      console.log("No content-length header found.");
    }
  } catch (error: any) {
    console.log(`FAILED: ${error.message}`);
  }
}

main();
