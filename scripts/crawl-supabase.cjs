/**
 * Wrapper that calls the actual multi-source crawler.
 */
const { execSync } = require("child_process");
const path = require("path");

const crawlerPath = path.join(__dirname, "crawl-multi-source.cjs");

console.log("Running multi-source crawler with AI content generation...");
execSync(`node ${crawlerPath}`, { stdio: "inherit" });
