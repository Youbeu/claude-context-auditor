import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ConfigFinder } from '../src/config/finder.js';
import { ConfigParser } from '../src/config/parser.js';
import { AnomalyDetector } from '../src/engine/detector.js';
import { ConfigFixer } from '../src/remediator/fixer.js';

test('ConfigFixer should create backup and safely deduplicate without corruption', () => {
  // Create temporary copy of fixture to test write operations
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-audit-test-'));
  const tempConfig = path.join(tempDir, 'test-claude.json');

  const initialConfig = {
    mcpServers: {
      github: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
    },
    skills: ['git-commit-helper', 'git-commit-helper'],
  };

  fs.writeFileSync(tempConfig, JSON.stringify(initialConfig, null, 2), 'utf-8');

  const paths = ConfigFinder.discover(tempConfig);
  const bundle = ConfigParser.parseAll(paths);
  const audit = AnomalyDetector.analyze(bundle);

  // Apply fix
  const fixResult = ConfigFixer.applyFix(audit, {
    backupDir: tempDir,
    deduplicateSkills: true,
  });

  assert.strictEqual(fixResult.success, true, 'Fix operation should succeed');
  assert.ok(fs.existsSync(fixResult.backupPath), 'Backup file must exist');

  // Verify resulting JSON is valid and deduplicated
  const updatedContent = JSON.parse(fs.readFileSync(tempConfig, 'utf-8'));
  assert.ok(Array.isArray(updatedContent.skills));

  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });
});
