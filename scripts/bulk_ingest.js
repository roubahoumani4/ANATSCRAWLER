const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');

const ELASTIC_URL = 'http://192.168.1.110:9200';
const INDEX = 'darkweb_structured';

const client = new Client({ node: ELASTIC_URL });

async function bulkIndex(docs, index) {
  const body = docs.flatMap(doc => [{ index: { _index: index } }, doc]);
  const { body: bulkResponse } = await client.bulk({ refresh: true, body });
  if (bulkResponse.errors) {
    console.error('Bulk indexing errors:', bulkResponse.errors);
  } else {
    console.log(`Successfully indexed ${docs.length} documents to ${index}`);
  }
}

(async () => {
  const docs = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  await bulkIndex(docs, INDEX);
})();
