// backend/routes/api.js - UPDATED with better error handling & ID fixes
const express = require('express');
const authenticate = require('../middleware/auth');
const githubService = require('../services/githubService');
const aiService = require('../services/aiService');
const TestCase = require('../models/TestCase');

const router = express.Router();

// Get user repositories
router.get('/repos', authenticate, async (req, res) => {
  try {
    const repos = await githubService.getUserRepositories(req.user);
    res.json({ repositories: repos });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({
      message: 'Failed to fetch repositories',
      error: error.message
    });
  }
});

// Get repository files
router.get('/repos/:owner/:repo/files', authenticate, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const files = await githubService.getRepositoryFiles(req.user, owner, repo);
    res.json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({
      message: 'Failed to fetch repository files',
      error: error.message
    });
  }
});

// Get file content
router.post('/files/content', authenticate, async (req, res) => {
  try {
    const { owner, repo, files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: 'Files array is required' });
    }

    const filesContent = await githubService.getFilesContent(req.user, owner, repo, files);
    res.json({ files: filesContent });
  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).json({
      message: 'Failed to fetch file content',
      error: error.message
    });
  }
});

// Generate test case summaries
router.post('/generate/summary', authenticate, async (req, res) => {
  try {
    const { owner, repo, files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: 'Files array is required' });
    }

    // Create new test case record
    const testCase = new TestCase({
      userId: req.user._id,
      repository: { owner, name: repo, fullName: `${owner}/${repo}` },
      files,
      status: 'processing'
    });
    await testCase.save();

    // Generate summaries using AI
    const summaries = await aiService.generateTestSummaries(files);

    // Ensure every summary has an ID
    testCase.summaries = summaries.map(s => ({
      ...s,
      id: s.id || s._id?.toString() || new Date().getTime().toString()
    }));
    testCase.status = 'completed';
    await testCase.save();

    res.json({
      testCaseId: testCase._id,
      summaries: testCase.summaries
    });
  } catch (error) {
    console.error('Error generating summaries:', error);
    res.status(500).json({
      message: 'Failed to generate test summaries',
      error: error.message
    });
  }
});

// Generate specific test code
router.post('/generate/code', authenticate, async (req, res) => {
  try {
    const { testCaseId, summaryIds } = req.body;

    if (!testCaseId || !summaryIds || !Array.isArray(summaryIds)) {
      return res.status(400).json({ message: 'testCaseId and summaryIds array are required' });
    }

    const testCase = await TestCase.findById(testCaseId);
    if (!testCase || testCase.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Test case not found' });
    }

    const generatedCodes = [];

    for (const summaryId of summaryIds) {
      const summary = testCase.summaries.find(
        s => s.id === summaryId || s._id?.toString() === summaryId
      );
      if (summary) {
        const code = await aiService.generateTestCode(testCase.files, summary);
        generatedCodes.push({
          summaryId: summary.id || summary._id?.toString(),
          ...code
        });
      }
    }

    if (generatedCodes.length === 0) {
      return res.status(400).json({ message: 'No valid summaries found for code generation' });
    }

    testCase.generatedCode.push(...generatedCodes);
    await testCase.save();

    res.json({ generatedCode: generatedCodes });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({
      message: 'Failed to generate test code',
      error: error.message
    });
  }
});

// Create GitHub PR with generated tests
router.post('/generate/pr', authenticate, async (req, res) => {
  try {
    const { testCaseId, generatedCodeIds } = req.body;

    if (!testCaseId || !generatedCodeIds || !Array.isArray(generatedCodeIds)) {
      return res.status(400).json({ message: 'testCaseId and generatedCodeIds array are required' });
    }

    const testCase = await TestCase.findById(testCaseId);
    if (!testCase || testCase.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Test case not found' });
    }

    const codes = generatedCodeIds.length > 0
      ? testCase.generatedCode.filter(code =>
          generatedCodeIds.includes(code._id?.toString()) ||
          generatedCodeIds.includes(code.summaryId)
        )
      : testCase.generatedCode;

    if (codes.length === 0) {
      return res.status(400).json({ message: 'No generated code found for PR creation' });
    }

    console.log(`Creating PR for ${testCase.repository.owner}/${testCase.repository.name}`);
    console.log(`Generated codes count: ${codes.length}`);

    const prUrl = await githubService.createPullRequest(
      req.user,
      testCase.repository.owner,
      testCase.repository.name,
      codes
    );

    res.json({
      pullRequestUrl: prUrl,
      message: 'Pull request created successfully',
      filesCreated: codes.length
    });
  } catch (error) {
    console.error('Error creating PR:', error);

    let userMessage = 'Failed to create pull request';
    if (error.message.includes('Permission denied')) {
      userMessage = 'Permission denied. Please ensure you have write access to this repository.';
    } else if (error.message.includes('not found')) {
      userMessage = 'Repository not found or not accessible.';
    } else if (error.message.includes('branch already exists')) {
      userMessage = 'A similar branch already exists. Please try again.';
    } else if (error.message.includes('default branch')) {
      userMessage = 'Could not determine the default branch of the repository.';
    }

    res.status(500).json({
      message: userMessage,
      error: error.message,
      details: 'Check repository permissions and try again.'
    });
  }
});

// Get test case history
router.get('/testcases', authenticate, async (req, res) => {
  try {
    const testCases = await TestCase.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('repository summaries generatedCode status createdAt');

    res.json({ testCases });
  } catch (error) {
    console.error('Error fetching test cases:', error);
    res.status(500).json({
      message: 'Failed to fetch test cases',
      error: error.message
    });
  }
});

// Debug endpoint to check user permissions
router.get('/debug/user', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        githubId: req.user.githubId
      },
      tokenScopes: 'Check GitHub token scopes in your OAuth app',
      message: 'User authenticated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
