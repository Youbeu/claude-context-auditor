import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { ConfigFinder } from '../src/config/finder.js';
import { ConfigParser } from '../src/config/parser.js';
import { AnomalyDetector } from '../src/engine/detector.js';

test('AnomalyDetector should identify heavy MCP overhead and skill duplicates', () => {
  const bloatedFixture = path.join(process.cwd(), 'tests', 'fixtures', 'bloated_claude.json');
  const paths = ConfigFinder.discover(bloatedFixture, process.cwd(), { includeGlobalSkills: false });
  const bundle = ConfigParser.parseAll(paths);
  const audit = AnomalyDetector.analyze(bundle);

  assert.ok(
    audit.sessionSummary.totalContextBeforeConversation > 40000,
    `Total tokens should be > 40k in bloated config, got ${audit.sessionSummary.totalContextBeforeConversation}`
  );
  assert.ok(
    audit.sessionSummary.overheadPercentage > 20,
    `Overhead percentage should be > 20%, got ${audit.sessionSummary.overheadPercentage}%`
  );

  // Should detect MCP bloat (e.g. github, jira)
  const mcpBloat = audit.anomalies.find(a => a.category === 'MCP_BLOAT');
  assert.ok(mcpBloat, 'Should detect MCP_BLOAT category');

  // Should identify top offenders
  assert.ok(audit.topOffenders.length > 0, 'Should list top offenders');
  assert.ok(audit.topOffenders[0].tokens > 5000, 'Top offender should have significant token weight');
});

test('AnomalyDetector should recognize clean configuration', () => {
  const cleanFixture = path.join(process.cwd(), 'tests', 'fixtures', 'clean_claude.json');
  const paths = ConfigFinder.discover(cleanFixture, process.cwd(), { includeGlobalSkills: false });
  const bundle = ConfigParser.parseAll(paths);
  const audit = AnomalyDetector.analyze(bundle);

  assert.ok(
    audit.sessionSummary.totalContextBeforeConversation < 15000,
    `Clean config should have low token count, got ${audit.sessionSummary.totalContextBeforeConversation}`
  );
  assert.ok(
    audit.sessionSummary.overheadPercentage < 10,
    `Overhead should be under 10%, got ${audit.sessionSummary.overheadPercentage}%`
  );
});
