/**
 * Configuration for llms.txt generation.
 *
 * This file contains project-level metadata that can't be specified
 * in individual documentation files' frontmatter.
 *
 * Individual pages control their inclusion via frontmatter:
 *   llms: true (default) | "optional" | false
 *   llms_description: "Short description for LLM context"
 */

export const llmsConfig = {
  /**
   * Project name — used as H1 heading in llms.txt
   */
  title: 'Buggregator',

  /**
   * Brief project summary — rendered as blockquote after H1
   */
  summary:
    'Buggregator is a free, open-source debugging server. Debug everything — install nothing. One docker run (or a single binary) gives you exceptions, dumps, emails, profiling, and logs in a single real-time UI. Written in Go with an embedded SQLite database. Runs beside your app, not inside it.',

  /**
   * Key facts about the project — rendered as a list before doc sections.
   * Keep concise and factual, oriented at what an LLM needs to know.
   */
  details: [
    'Install (binary, no Docker): download https://github.com/buggregator/server/releases/latest/download/buggregator-<os>-<arch> (linux-amd64, linux-arm64, darwin-arm64, darwin-amd64, windows-amd64.exe, windows-arm64.exe), chmod +x, run. AI agents: follow /agent-setup.md',
    'Install (Docker): `docker run --pull always -p 127.0.0.1:8000:8000 -p 127.0.0.1:1025:1025 -p 127.0.0.1:9912:9912 ghcr.io/buggregator/server:latest`',
    'GitHub: https://github.com/buggregator/server',
    'Lightweight CLI alternative (no Docker): `composer require --dev buggregator/trap`',
    'JetBrains IDE plugin: https://plugins.jetbrains.com/plugin/26344-buggregator',
    'Supported integrations: Sentry SDK, Symfony VarDumper, Monolog, Spatie Ray, Inspector, SMTP, HTTP dumps, XHProf, SMS',
    'Also built in: HTTP proxy, mock server under /mock/, Xdebug proxy (off by default), MCP server for AI assistants',
    'Works with: Laravel, Symfony, Spiral, WordPress, Yii, Drupal — and JS, Python, Ruby, Go via Sentry SDK',
  ],

  /**
   * Base URL for documentation links in llms.txt.
   * Page paths from frontmatter are appended to this.
   */
  baseUrl: '',

  /**
   * Section name for documentation pages
   */
  docsSection: 'Docs',

  /**
   * Section name for pages with llms: "optional"
   */
  optionalSection: 'Optional',
}
