import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const owner = "ladenvsusa";
const repo = "personal-ops-beta";
const packageInfo = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
const tag = `v${packageInfo.version}`;
const releaseName = `个人运营系统 Beta ${packageInfo.version.replace("-beta", "")}`;
const description = "个人运营系统 Beta：聚合人际、运动、学习、工作、理财、出行的 Android 个人看板与信息管理工具。";
const topics = [
  "android",
  "capacitor",
  "personal-dashboard",
  "life-management",
  "productivity",
  "personal-crm",
  "finance-tracker",
  "travel-log"
];
const apkPath = "C:/Users/0/Documents/Codex/2026-07-08/new-chat/outputs/personal-os-beta-debug.apk";
const releaseNotesPath = resolve("RELEASE_NOTES.md");

function getGithubToken() {
  const input = "protocol=https\nhost=github.com\n\n";
  const output = execFileSync("git", ["credential", "fill"], { input, encoding: "utf8" });
  const passwordLine = output.split(/\r?\n/).find((line) => line.startsWith("password="));
  if (!passwordLine) {
    throw new Error("No GitHub token was returned by Git Credential Manager.");
  }
  return passwordLine.slice("password=".length);
}

async function githubFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "personal-ops-beta-publisher",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${options.method || "GET"} ${url} failed: ${response.status} ${text}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

const token = getGithubToken();
const repoApi = `https://api.github.com/repos/${owner}/${repo}`;

await githubFetch(repoApi, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    description,
    has_issues: true,
    has_projects: true,
    has_wiki: false
  })
});

await githubFetch(`${repoApi}/topics`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ names: topics })
});

const releaseNotes = readFileSync(releaseNotesPath, "utf8");
let release = null;
const existingReleaseResponse = await fetch(`${repoApi}/releases/tags/${tag}`, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "personal-ops-beta-publisher"
  }
});

if (existingReleaseResponse.status === 404) {
  release = await githubFetch(`${repoApi}/releases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tag_name: tag,
      target_commitish: "main",
      name: releaseName,
      body: releaseNotes,
      prerelease: true,
      draft: false
    })
  });
} else if (existingReleaseResponse.ok) {
  const existingRelease = await existingReleaseResponse.json();
  release = await githubFetch(`${repoApi}/releases/${existingRelease.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: releaseName,
      body: releaseNotes,
      prerelease: true,
      draft: false
    })
  });
} else {
  throw new Error(`GET release failed: ${existingReleaseResponse.status} ${await existingReleaseResponse.text()}`);
}

const assetName = basename(apkPath);
const assets = await githubFetch(`${repoApi}/releases/${release.id}/assets`);
const oldAsset = assets.find((asset) => asset.name === assetName);
if (oldAsset) {
  await githubFetch(`${repoApi}/releases/assets/${oldAsset.id}`, { method: "DELETE" });
}

const uploadUrl = release.upload_url.replace("{?name,label}", `?name=${encodeURIComponent(assetName)}`);
await githubFetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": "application/vnd.android.package-archive" },
  body: readFileSync(apkPath)
});

console.log(`Repository metadata updated: https://github.com/${owner}/${repo}`);
console.log(`Release updated: https://github.com/${owner}/${repo}/releases/tag/${tag}`);
