#!/usr/bin/env node
// migrate_chunks_to_structured.js
// REST-based migration for Elasticsearch 9.x with debug logging
// Requires: npm install node-fetch@2

const fetch = require('node-fetch');

const ES_HOST = process.env.ES_HOST || 'http://192.168.1.110:9200';
const SOURCE_INDEX = 'filesearchdb.fs.chunks';
const TARGET_INDEX = 'darkweb_structured';

function cleanValue(val) {
  if (!val || val.trim() === '' || val.trim().toLowerCase() === 'none') return '';
  return val.trim();
}

function parseField1And2(field1, field2) {
  const parts1 = field1.split(',');
  const parts2 = field2.split(',');

  // Map the first 8 fields
  const doc = {
    user_id: cleanValue(parts1[0]),
    phone: cleanValue(parts1[1]),
    first_name: cleanValue(parts1[2]),
    last_name: cleanValue(parts1[3]),
    email: cleanValue(parts1[4]),
    birthdate: cleanValue(parts1[5]),
    gender: cleanValue(parts1[6]),
    locale: cleanValue(parts1[7]),
    city: cleanValue(parts1[8]),
    // fallback for city if not present
  };

  // Find and extract location(s) and link(s)
  let location = '', location2 = '', link = '', link2 = '', protocol = '';
  for (let i = 9; i < parts1.length; ++i) {
    const val = cleanValue(parts1[i]);
    if (val.startsWith('Location*')) {
      // Next value is location
      if (i + 1 < parts1.length) {
        if (!location) location = cleanValue(parts1[i + 1]);
        else location2 = cleanValue(parts1[i + 1]);
        i++;
      }
    } else if (val.startsWith('link*')) {
      // Next value is link/protocol
      if (i + 1 < parts1.length) {
        if (!link) link = cleanValue(parts1[i + 1]);
        else link2 = cleanValue(parts1[i + 1]);
        i++;
      }
      if (i + 1 < parts1.length && (parts1[i + 1] === 'https' || parts1[i + 1] === 'http')) {
        protocol = parts1[i + 1];
        i++;
      }
    }
  }

  // field2: usually a link (facebook, etc)
  let social_link = '';
  if (parts2[0] && parts2[0].startsWith('//')) {
    social_link = 'https:' + parts2[0];
  }

  // Use social_link as main link if link is just 'https' or 'http' or empty
  const main_link = (link && link !== "https" && link !== "http") ? link : social_link;

  // Compose structured doc with all required fields and a context field
  return {
    ...doc,
    location,
    location2,
    link: main_link,
    link2,
    protocol,
    social_link,
    source: "Facebook",
    timestamp: doc.birthdate || "N/A",
    fileType: "profile",
    fileName: doc.user_id ? `${doc.user_id}.json` : "Unknown",
    extractionConfidence: "High",
    context: [doc.first_name, doc.last_name, location, main_link, social_link].filter(Boolean).join(" | ")
  };
}

function extractFieldObjectsFromContent(content) {
  // Use regex to extract all { "field1": ..., "field2": ... } objects from the content string
  const regex = /\{\s*"field1"\s*:\s*"([^"]*)",\s*"field2"\s*:\s*"([^"]*)"\s*\}/g;
  let match;
  const results = [];
  while ((match = regex.exec(content)) !== null) {
    results.push({ field1: match[1], field2: match[2] });
  }
  return results;
}

async function migrate() {
  let total = 0;
  let scrollId = null;
  try {
    // Initial search with scroll
    let resp = await fetch(`${ES_HOST}/${SOURCE_INDEX}/_search?scroll=2m`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size: 500, query: { match_all: {} } })
    });
    let data = await resp.json();
    if (!data.hits || !data.hits.hits.length) {
      console.log('No documents found in source index:', SOURCE_INDEX);
      return;
    }
    scrollId = data._scroll_id;
    let batchNum = 1;
    while (data.hits && data.hits.hits.length) {
      console.log(`Batch ${batchNum}: fetched ${data.hits.hits.length} documents.`);
      const bulkOps = [];
      let skipped = 0;
      let debugCount = 0;
      for (const hit of data.hits.hits) {
        const content = hit._source.content || '';
        const fieldObjs = extractFieldObjectsFromContent(content);
        if (debugCount < 2) {
          console.log('DEBUG content sample:', content.slice(0, 500));
          console.log('DEBUG extracted fieldObjs:', fieldObjs.slice(0, 2));
        }
        for (const { field1, field2 } of fieldObjs) {
          const doc = parseField1And2(field1, field2);
          const mainFields = [doc.user_id, doc.phone, doc.first_name, doc.last_name];
          if (mainFields.every(f => !f)) {
            skipped++;
            continue;
          }
          bulkOps.push(`{ "index": { "_index": "${TARGET_INDEX}" } }`);
          bulkOps.push(JSON.stringify(doc));
        }
        debugCount++;
      }
      console.log(`Batch ${batchNum}: ${bulkOps.length / 2} docs to index, ${skipped} skipped.`);
      if (bulkOps.length) {
        await fetch(`${ES_HOST}/_bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-ndjson' },
          body: bulkOps.join('\n') + '\n'
        });
        total += bulkOps.length / 2;
        console.log(`Indexed ${bulkOps.length / 2} docs...`);
      }
      // Fetch next batch
      resp = await fetch(`${ES_HOST}/_search/scroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scroll: '2m', scroll_id: scrollId })
      });
      data = await resp.json();
      scrollId = data._scroll_id;
      if (!data.hits || !data.hits.hits.length) break;
      batchNum++;
    }
    console.log(`Full migration complete. Total documents indexed: ${total}`);
  } catch (err) {
    console.error('Migration error:', err);
  }
}

migrate();
