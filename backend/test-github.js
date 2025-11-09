require('dotenv').config();
const { Octokit } = require('@octokit/rest');

// Replace YOUR_GITHUB_USERNAME with your actual username
const username = 'YOUR_GITHUB_USERNAME'; 

async function test() {
  // Use your OAuth token from the database or create a personal access token
  const token = 'YOUR_TOKEN_HERE';
  const octokit = new Octokit({ auth: token });
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log('✅ Connected as:', user.login);
  
  const { data: repos } = await octokit.repos.listForAuthenticatedUser();
  const ownedRepo = repos.find(r => r.owner.login === user.login);
  console.log('✅ Found repo:', ownedRepo?.full_name);
}

test().catch(console.error);