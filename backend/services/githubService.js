// backend/services/githubService.js - FIXED VERSION
const { Octokit } = require('@octokit/rest');

class GitHubService {
  getOctokit(user) {
    return new Octokit({ auth: user.accessToken });
  }

  async getUserRepositories(user) {
    try {
      const octokit = this.getOctokit(user);
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 50
      });

      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        description: repo.description,
        language: repo.language,
        updatedAt: repo.updated_at,
        url: repo.html_url
      }));
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error('Failed to fetch repositories');
    }
  }

  async getRepositoryFiles(user, owner, repo, path = '') {
    try {
      const octokit = this.getOctokit(user);
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path
      });

      const files = [];
      
      for (const item of Array.isArray(data) ? data : [data]) {
        if (item.type === 'file' && this.isSupportedFile(item.name)) {
          files.push({
            name: item.name,
            path: item.path,
            type: 'file',
            size: item.size,
            downloadUrl: item.download_url,
            language: this.getFileLanguage(item.name)
          });
        } else if (item.type === 'dir') {
          try {
            const subFiles = await this.getRepositoryFiles(user, owner, repo, item.path);
            files.push({
              name: item.name,
              path: item.path,
              type: 'dir',
              children: subFiles
            });
          } catch (subError) {
            console.warn(`Failed to fetch subdirectory ${item.path}:`, subError.message);
          }
        }
      }

      return files;
    } catch (error) {
      console.error('Error fetching repository files:', error);
      throw new Error('Failed to fetch repository files');
    }
  }

  async getFilesContent(user, owner, repo, filePaths) {
    try {
      const octokit = this.getOctokit(user);
      const filesContent = [];

      for (const filePath of filePaths) {
        try {
          const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath
          });

          if (data.type === 'file' && data.content) {
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            filesContent.push({
              path: filePath,
              content,
              language: this.getFileLanguage(filePath),
              size: data.size
            });
          }
        } catch (fileError) {
          console.warn(`Failed to fetch ${filePath}:`, fileError.message);
        }
      }

      return filesContent;
    } catch (error) {
      console.error('Error fetching files content:', error);
      throw new Error('Failed to fetch files content');
    }
  }

  async createPullRequest(user, owner, repo, generatedCodes) {
    const octokit = this.getOctokit(user);
    
    try {
      console.log(`Creating PR for ${owner}/${repo} with ${generatedCodes.length} test files`);
      
      // Step 1: Get the default branch (could be 'main' or 'master')
      let defaultBranch;
      try {
        const { data: repoData } = await octokit.repos.get({ owner, repo });
        defaultBranch = repoData.default_branch;
        console.log(`Default branch: ${defaultBranch}`);
      } catch (error) {
        console.warn('Failed to get repo info, defaulting to main branch');
        defaultBranch = 'main';
      }

      // Step 2: Get the latest commit SHA from the default branch
      let latestSha;
      try {
        const { data: refData } = await octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${defaultBranch}`
        });
        latestSha = refData.object.sha;
        console.log(`Latest commit SHA: ${latestSha}`);
      } catch (error) {
        // If main doesn't exist, try master
        try {
          const { data: refData } = await octokit.git.getRef({
            owner,
            repo,
            ref: `heads/master`
          });
          defaultBranch = 'master';
          latestSha = refData.object.sha;
          console.log(`Using master branch, SHA: ${latestSha}`);
        } catch (masterError) {
          throw new Error(`Could not find default branch. Tried 'main' and 'master'.`);
        }
      }

      // Step 3: Create a new branch
      const branchName = `workik-ai-tests-${Date.now()}`;
      try {
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branchName}`,
          sha: latestSha
        });
        console.log(`Created branch: ${branchName}`);
      } catch (error) {
        console.error('Failed to create branch:', error);
        throw new Error(`Failed to create branch: ${error.message}`);
      }

      // Step 4: Create test files
      const createdFiles = [];
      for (const codeData of generatedCodes) {
        try {
          // Ensure tests directory structure
          const filePath = `tests/${codeData.filename}`;
          
          console.log(`Creating file: ${filePath}`);
          
          const { data: fileData } = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: `Add AI-generated test: ${codeData.filename}`,
            content: Buffer.from(codeData.code, 'utf-8').toString('base64'),
            branch: branchName
          });
          
          createdFiles.push(filePath);
          console.log(`Successfully created: ${filePath}`);
          
        } catch (fileError) {
          console.error(`Failed to create ${codeData.filename}:`, fileError);
          // Continue with other files even if one fails
        }
      }

      if (createdFiles.length === 0) {
        throw new Error('Failed to create any test files');
      }

      // Step 5: Create README for the tests
      try {
        const readmeContent = `# AI Generated Test Cases

This directory contains test cases automatically generated by Workik AI Test Case Generator.

## Generated Files
${createdFiles.map(file => `- ${file}`).join('\n')}

## Setup Instructions

### For JavaScript/TypeScript projects:
\`\`\`bash
npm install --save-dev ${generatedCodes[0]?.framework || 'jest'}
npm test
\`\`\`

### For Python projects:
\`\`\`bash
pip install ${generatedCodes[0]?.framework || 'pytest'}
${generatedCodes[0]?.framework || 'pytest'}
\`\`\`

### For Java projects:
\`\`\`bash
mvn test
\`\`\`

## Generated by Workik AI 🚀
These tests were generated using advanced AI to provide comprehensive coverage for your codebase.
`;

        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: 'tests/README.md',
          message: 'Add AI-generated tests README',
          content: Buffer.from(readmeContent, 'utf-8').toString('base64'),
          branch: branchName
        });
      } catch (readmeError) {
        console.warn('Failed to create README:', readmeError.message);
        // Non-critical, continue
      }

      // Step 6: Create the pull request
      try {
        const { data: pr } = await octokit.pulls.create({
          owner,
          repo,
          title: '🤖 AI Generated Test Cases',
          head: branchName,
          base: defaultBranch,
          body: `## 🚀 AI Generated Test Cases

This PR contains **${createdFiles.length}** automatically generated test cases using **Workik AI Test Case Generator**.

### 📁 Generated Files:
${createdFiles.map(file => `- \`${file}\``).join('\n')}

### 🧪 Test Framework:
- **Framework**: ${generatedCodes[0]?.framework || 'Multiple'}
- **Language**: ${generatedCodes[0]?.language || 'Multiple'}
- **Test Types**: Unit, Integration, Edge Cases

### 🏃‍♂️ How to Run:
\`\`\`bash
${generatedCodes[0]?.setupInstructions || 'npm test'}
\`\`\`

### 🤖 About Workik AI:
These tests were intelligently generated by analyzing your codebase structure, identifying key functions, and creating comprehensive test scenarios including:
- ✅ Happy path scenarios
- ✅ Edge cases and boundary conditions  
- ✅ Error handling validation
- ✅ Integration testing

---
*Generated by [Workik AI Test Case Generator](https://github.com) 🚀*`,
          maintainer_can_modify: true
        });

        console.log(`Successfully created PR: ${pr.html_url}`);
        return pr.html_url;

      } catch (prError) {
        console.error('Failed to create PR:', prError);
        throw new Error(`Failed to create pull request: ${prError.message}`);
      }

    } catch (error) {
      console.error('Error in createPullRequest:', error);
      
      // Provide more specific error messages
      if (error.status === 403) {
        throw new Error('Permission denied. Please ensure the GitHub token has repository write access.');
      } else if (error.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found or not accessible.`);
      } else if (error.status === 422) {
        throw new Error('Invalid request. The repository might not allow pull requests or the branch already exists.');
      } else {
        throw new Error(`GitHub API error: ${error.message}`);
      }
    }
  }

  isSupportedFile(filename) {
    const supportedExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', 
      '.cpp', '.c', '.cs', '.php', '.rb', '.swift', '.kt'
    ];
    return supportedExtensions.some(ext => filename.endsWith(ext));
  }

  getFileLanguage(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin'
    };
    return languageMap[ext] || 'text';
  }
}

module.exports = new GitHubService();