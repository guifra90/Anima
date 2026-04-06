/**
 * Local test for Scoro Executor mapping.
 */
const executor = require('./executor');
require('dotenv').config();


const dummyCredentials = {
  apiKey: 'test-key',
  companyId: 'test-id',
  baseUrl: 'https://proweb.scoro.com/api/v2/'
};

async function test() {
  console.log('--- TEST 1: list_projects (Real Connection) ---');
  try {
    const res1 = await executor.run('list_projects', { limit: 2 }, {});
    console.log(JSON.stringify(res1, null, 2));
  } catch (e) { console.error('Step 1 Failed:', e.message); }

  console.log('\n--- TEST 2: get_tasks (Real Connection) ---');
  try {
    const res2 = await executor.run('get_tasks', { projectId: 'P001' }, {});
    console.log(JSON.stringify(res2, null, 2));
  } catch (e) { console.error('Step 2 Failed:', e.message); }

  console.log('\n--- TEST 3: get_financial_summary (Real Connection) ---');
  try {
    const res3 = await executor.run('get_financial_summary', {}, {});
    console.log(JSON.stringify(res3, null, 2));
  } catch (e) { console.error('Step 3 Failed:', e.message); }
}

test();
