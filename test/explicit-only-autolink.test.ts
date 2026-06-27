// Fork: explicit-only auto-link mode for trusted-remote (stdio MCP) writes.
// The stdio `gbrain serve` is the machine owner's own process and is trusted to
// auto-link, but only via AUTHOR-WRITTEN link syntax ([[dir/slug]], [md](path)).
// The bare-slug-in-prose pass is the recall-poisoning vector (a bare `people/x`
// in pasted/ingested text becomes a graph edge), so explicit-only skips it.
import { describe, test, expect } from 'bun:test';
import { extractPageLinks, type SlugResolver } from '../src/core/link-extraction.ts';

const nullResolver: SlugResolver = { resolve: async () => null };

// Resolver that resolves bare basenames — needed to exercise the generic
// `[[bare-name]]` pass (which is what explicit-only must drop).
const basenameResolver: SlugResolver = {
  resolve: async () => null,
  resolveBasenameMatches: async (name: string) =>
    name === 'struktura' ? ['projects/struktura'] : [],
};

describe('extractPageLinks — explicit-only mode (trusted-remote autolink)', () => {
  test('explicit-only DROPS bare dir/slug in prose (injection guard)', async () => {
    const content = 'See companies/acme for details and ping people/alice-chen.';
    const { candidates } = await extractPageLinks(
      'docs/x', content, {}, 'concept', nullResolver, { explicitOnly: true },
    );
    expect(candidates.find(c => c.targetSlug === 'companies/acme')).toBeUndefined();
    expect(candidates.find(c => c.targetSlug === 'people/alice-chen')).toBeUndefined();
    expect(candidates.length).toBe(0);
  });

  test('default mode STILL links bare dir/slug (regression guard — full extractor unchanged)', async () => {
    const content = 'See companies/acme for details.';
    const { candidates } = await extractPageLinks(
      'docs/x', content, {}, 'concept', nullResolver,
    );
    expect(candidates.find(c => c.targetSlug === 'companies/acme')).toBeDefined();
  });

  test('explicit-only KEEPS DIR-qualified [[wikilinks]]', async () => {
    const content = 'Met with [[people/alice-chen]] today.';
    const { candidates } = await extractPageLinks(
      'docs/x', content, {}, 'concept', nullResolver, { explicitOnly: true },
    );
    expect(candidates.find(c => c.targetSlug === 'people/alice-chen')).toBeDefined();
  });

  test('explicit-only KEEPS author-written [Name](dir/slug) markdown links', async () => {
    const content = 'Met with [Alice](people/alice-chen) today.';
    const { candidates } = await extractPageLinks(
      'docs/x', content, {}, 'concept', nullResolver, { explicitOnly: true },
    );
    expect(candidates.find(c => c.targetSlug === 'people/alice-chen')).toBeDefined();
  });

  test('explicit-only DROPS generic [[bare-name]] (fuzzy-resolved, not author-qualified)', async () => {
    const content = 'The [[struktura]] project shipped.';
    const { candidates } = await extractPageLinks(
      'docs/x', content, {}, 'concept', basenameResolver,
      { explicitOnly: true, globalBasename: true },
    );
    expect(candidates.find(c => c.targetSlug === 'projects/struktura')).toBeUndefined();
  });

  test('default + globalBasename STILL resolves generic [[bare-name]] (regression guard)', async () => {
    const content = 'The [[struktura]] project shipped.';
    const { candidates } = await extractPageLinks(
      'docs/x', content, {}, 'concept', basenameResolver, { globalBasename: true },
    );
    expect(candidates.find(c => c.targetSlug === 'projects/struktura')).toBeDefined();
  });
});
