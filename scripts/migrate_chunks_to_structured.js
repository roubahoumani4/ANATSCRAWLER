#!/usr/bin/env node
// migrate_chunks_to_structured.js
// REST-based migration for Elasticsearch 9.x with debug logging
// Uses native fetch (Node.js 18+)

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

  // Map the first 8 fields with better defaults
  const doc = {
    user_id: cleanValue(parts1[0]) || "Unknown",
    phone: cleanValue(parts1[1]) || "Unknown",
    first_name: cleanValue(parts1[2]) || "Unknown",
    last_name: cleanValue(parts1[3]) || "Unknown",
    email: cleanValue(parts1[4]) || "Unknown",
    birthdate: cleanValue(parts1[5]) || "Unknown",
    gender: cleanValue(parts1[6]) || "Unknown",
    locale: cleanValue(parts1[7]) || "Unknown",
    city: cleanValue(parts1[8]) || "Unknown",
  };

  // Find and extract location(s) and link(s)
  let location = '', location2 = '', link = '', link2 = '', protocol = '';
  for (let i = 9; i < parts1.length; ++i) {
    const val = cleanValue(parts1[i]);
    if (val.startsWith('Location*')) {
      if (i + 1 < parts1.length) {
        if (!location) location = cleanValue(parts1[i + 1]) || "Unknown";
        else location2 = cleanValue(parts1[i + 1]) || "Unknown";
        i++;
      }
    } else if (val.startsWith('link*')) {
      if (i + 1 < parts1.length) {
        if (!link) link = cleanValue(parts1[i + 1]) || "No link";
        else link2 = cleanValue(parts1[i + 1]) || "No link";
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

  const main_link = (link && link !== "https" && link !== "http") ? link : (social_link || "No link");

  // Compose structured doc with all required fields and a context field
  return {
    ...doc,
    location: location || "Unknown",
    location2: location2 || "Unknown",
    link: main_link,
    link2: link2 || "No link",
    protocol: protocol || "Unknown",
    social_link: social_link || "No link",
    source: "Facebook",
    timestamp: doc.birthdate || "Unknown",
    fileType: "profile",
    fileName: doc.user_id ? `${doc.user_id}.json` : "Unknown",
    extractionConfidence: "High",
    context: [
      doc.first_name,
      doc.last_name,
      doc.gender,
      doc.city,
      location,
      main_link,
      social_link
    ].filter(Boolean).join(" | ")
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

async function setupTargetIndex() {
  // Delete the target index if it exists
  try {
    const resp = await fetch(`${ES_HOST}/${TARGET_INDEX}`, { method: 'HEAD' });
    if (resp.status === 200) {
      await fetch(`${ES_HOST}/${TARGET_INDEX}`, { method: 'DELETE' });
      console.log(`Deleted existing index: ${TARGET_INDEX}`);
    }
  } catch (err) {
    console.warn('Could not check/delete target index:', err);
  }
  // Create the target index with a mapping
  const mapping = {
    mappings: {
      properties: {
        user_id: { type: 'keyword' },
        phone: { type: 'keyword' },
        first_name: { type: 'text' },
        last_name: { type: 'text' },
        email: { type: 'keyword' },
        birthdate: { type: 'keyword' },
        gender: { type: 'keyword' },
        locale: { type: 'keyword' },
        city: { type: 'text' },
        location: { type: 'text' },
        location2: { type: 'text' },
        link: { type: 'keyword' },
        link2: { type: 'keyword' },
        protocol: { type: 'keyword' },
        social_link: { type: 'keyword' },
        source: { type: 'keyword' },
        timestamp: { type: 'keyword' },
        fileType: { type: 'keyword' },
        fileName: { type: 'keyword' },
        extractionConfidence: { type: 'keyword' },
        context: { type: 'text' }
      }
    }
  };
  await fetch(`${ES_HOST}/${TARGET_INDEX}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapping)
  });
  console.log(`Created index: ${TARGET_INDEX} with mapping.`);
}

async function migrate() {
  await setupTargetIndex();
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
