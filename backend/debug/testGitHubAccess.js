// backend/debug/testGitHubAccess.js
// Run this script to debug GitHub PR creation issues
require('dotenv').config();
const { Octokit } = require('@octokit/rest');
const User = require('../models/User');
const connectDB = require('../config/database');

async function debugGitHubAccess() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    // Find a test user (replace with your GitHub username)
    const testUsername = 'YOUR_GITHUB_USERNAME'; // Replace with your username
    const user = await User.findOne({ username: testUsername });
    
    if (!user) {
      console.log('❌ User not found. Please login first through the app');
      return;
    }
    
    console.log('✅ User found:', user.username);
    
    // Test GitHub API access
    const octokit = new Octokit({ auth: user.accessToken });
    
    // Test 1: Get authenticated user
    console.log('\n🔍 Testing GitHub authentication...');
    try {
      const { data: authUser } = await octokit.users.getAuthenticated();
      console.log('✅ GitHub auth successful:', authUser.login);
    } catch (error) {
      console.log('❌ GitHub auth failed:', error.message);
      return;
    }

    // Test 2: List repositories
    console.log('\n🔍 Testing repository access...');
    try {
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        per_page: 5
      });
      console.log(`✅ Found ${repos.length} repositories`);
      repos.forEach(repo => {
        console.log(`  - ${repo.full_name} (${repo.permissions?.push ? 'write' : 'read'} access)`);
      });
    } catch (error) {
      console.log('❌ Repository access failed:', error.message);
      return;
    }

    // Test 3: Check token scopes
    console.log('\n🔍 Testing token scopes...');
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${user.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      const scopes = response.headers.get('x-oauth-scopes');
      console.log('✅ Token scopes:', scopes);
      
      const requiredScopes = ['repo', 'user'];
      const hasRequiredScopes = requiredScopes.every(scope => 
        scopes?.includes(scope)
      );
      
      if (!hasRequiredScopes) {
        console.log('⚠️  Missing required scopes. Need: repo, user');
        console.log('   Current scopes:', scopes);
      } else {
        console.log('✅ All required scopes present');
      }
    } catch (error) {
      console.log('❌ Token scope check failed:', error.message);
    }

    // Test 4: Test PR creation on a specific repo
    console.log('\n🔍 Testing PR creation capabilities...');
    const testRepo = repos.find(repo => repo.permissions?.push);
    
    if (!testRepo) {
      console.log('❌ No repositories with write access found');
      return;
    }
    
    console.log(`Testing on repository: ${testRepo.full_name}`);
    
    try {
      // Check default branch
      const { data: repoData } = await octokit.repos.get({
        owner: testRepo.owner.login,
        repo: testRepo.name
      });
      console.log(`✅ Default branch: ${repoData.default_branch}`);
      
      // Get latest commit
      const { data: refData } = await octokit.git.getRef({
        owner: testRepo.owner.login,
        repo: testRepo.name,
        ref: `heads/${repoData.default_branch}`
      });
      console.log(`✅ Latest commit: ${refData.object.sha}`);
      
      console.log('✅ Repository is ready for PR creation');
      
    } catch (error) {
      console.log('❌ Repository check failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  } finally {
    process.exit();
  }
}

// Additional function to test specific repository
async function testSpecificRepo(owner, repo) {
  try {
    await connectDB();
    
    const testUsername = 'YOUR_GITHUB_USERNAME'; // Replace
    const user = await User.findOne({ username: testUsername });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    const octokit = new Octokit({ auth: user.accessToken });
    
    console.log(`\n🔍 Testing specific repository: ${owner}/${repo}`);
    
    // Check repo access
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    console.log(`✅ Repository access: ${repoData.name}`);
    console.log(`✅ Default branch: ${repoData.default_branch}`);
    console.log(`✅ Permissions: ${repoData.permissions?.push ? 'write' : 'read'}`);
    
    // Check if we can create a branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${repoData.default_branch}`
    });
    
    const testBranchName = `test-branch-${Date.now()}`;
    
    try {
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${testBranchName}`,
        sha: refData.object.sha
      });
      console.log(`✅ Test branch created: ${testBranchName}`);
      
      // Clean up - delete the test branch
      await octokit.git.deleteRef({
        owner,
        repo,
        ref: `heads/${testBranchName}`
      });
      console.log(`✅ Test branch deleted: ${testBranchName}`);
      
    } catch (branchError) {
      console.log('❌ Branch creation failed:', branchError.message);
    }
    
  } catch (error) {
    console.log('❌ Specific repo test failed:', error.message);
  } finally {
    process.exit();
  }
}

// Run debug script
console.log('🚀 Starting GitHub PR Debug Script...');
console.log('Make sure to replace YOUR_GITHUB_USERNAME with your actual username\n');

debugGitHubAccess();

// Uncomment to test specific repository:
// testSpecificRepo('YOUR_GITHUB_USERNAME', 'YOUR_REPO_NAME');