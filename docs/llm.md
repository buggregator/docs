---
llms_description: "LLM-readable documentation endpoints: llms.txt index, llms-full.txt complete docs, per-page .md files. Usage with ChatGPT, Claude, Cursor, Windsurf, and other AI assistants for Buggregator setup and configuration help."
---

# Using Buggregator docs with AI assistants

Buggregator documentation is available in a machine-readable format so that AI assistants (ChatGPT, Claude, Cursor,
Windsurf, GitHub Copilot, and others) can read it and help you set up, configure, and debug issues.

## Quick start

Give your AI assistant this URL:

```
https://docs.buggregator.dev/llms.txt
```

The assistant will read the index, understand what Buggregator is, and fetch the specific pages it needs to answer
your question.

### Example prompts

- "Read https://docs.buggregator.dev/llms.txt and help me set up Buggregator with my Laravel project"
- "I have a Symfony app. How do I send Monolog logs to Buggregator?"
- "Help me configure XHProf profiling for my PHP application"
- "What's the difference between Buggregator server and Trap?"

## Available endpoints

| URL | What it contains | When to use |
|-----|-----------------|-------------|
| [`/llms.txt`](https://docs.buggregator.dev/llms.txt) | Index with page descriptions | When the assistant supports browsing — it picks the relevant pages |
| [`/llms-full.txt`](https://docs.buggregator.dev/llms-full.txt) | Complete documentation in one file | Best for most assistants — give full context in one shot |
| `/<page>.md` | Individual page without frontmatter | When you only need a specific topic |

### Per-page URLs

If you only need help with a specific integration, you can point the assistant to a single page:

- `https://docs.buggregator.dev/config/sentry.md` — Sentry setup
- `https://docs.buggregator.dev/config/smtp.md` — SMTP / email testing
- `https://docs.buggregator.dev/config/xhprof.md` — XHProf profiling
- `https://docs.buggregator.dev/config/monolog.md` — Monolog logs
- `https://docs.buggregator.dev/config/var-dumper.md` — Symfony VarDumper
- `https://docs.buggregator.dev/config/ray.md` — Spatie Ray
- `https://docs.buggregator.dev/getting-started.md` — Installation guide

## How it works

These files follow the [llms.txt](https://llmstxt.org/) convention — a standard way to provide documentation
to AI models. The content is the same as the regular docs, just formatted for machine consumption (plain markdown,
no HTML, no navigation chrome).

The files are generated automatically during the docs build, so they're always up to date with the latest
documentation.
