import { writeFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from 'fs'
import path from 'path'
import { SiteConfig } from 'vitepress'
import type { Plugin } from 'vite'
// @ts-ignore
import matter from 'gray-matter'
import { llmsConfig } from '../../llms.config'

interface PageInfo {
  title: string
  llms_description: string
  url: string
  srcPath: string
  content: string
  section: 'docs' | 'optional'
}

function extractH1(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function readPages(srcDir: string): PageInfo[] {
  const pages: PageInfo[] = []
  if (!existsSync(srcDir)) return pages

  function scan(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scan(path.join(dir, entry.name))
      } else if (entry.name.endsWith('.md')) {
        const filePath = path.join(dir, entry.name)
        const raw = readFileSync(filePath, 'utf-8')
        const { data: fm, content } = matter(raw)

        if (fm.llms === false || !fm.llms_description) continue

        const relPath = path.relative(srcDir, filePath).replace(/\\/g, '/')
        const url = '/' + relPath.replace(/\.md$/, '')
        const llmsValue = fm.llms ?? true
        pages.push({
          title: fm.title || extractH1(content) || entry.name.replace(/\.md$/, ''),
          llms_description: fm.llms_description,
          url,
          srcPath: relPath,
          content: content.trim(),
          section: llmsValue === 'optional' ? 'optional' : 'docs',
        })
      }
    }
  }

  scan(srcDir)
  return pages
}

function getSidebarPaths(config: SiteConfig): string[] {
  const paths: string[] = []

  const sidebar =
    (config.site.locales?.root as any)?.themeConfig?.sidebar ??
    config.site.themeConfig?.sidebar ??
    {}

  function extract(items: any[]) {
    if (!Array.isArray(items)) return
    for (const item of items) {
      if (item.link) paths.push(item.link)
      if (item.items) extract(item.items)
    }
  }

  for (const section of Object.values(sidebar)) {
    if (Array.isArray(section)) extract(section)
  }

  return paths
}

function sortPages(pages: PageInfo[], sidebarPaths: string[]): PageInfo[] {
  const order = new Map(sidebarPaths.map((p, i) => [p, i]))

  return [...pages].sort((a, b) => {
    const ia = order.get(a.url) ?? 9999
    const ib = order.get(b.url) ?? 9999
    return ia - ib || a.url.localeCompare(b.url)
  })
}

function buildLlmsTxt(pages: PageInfo[]): string {
  const { title, summary, details, baseUrl, docsSection, optionalSection } = llmsConfig

  const docs = pages.filter(p => p.section === 'docs')
  const optional = pages.filter(p => p.section === 'optional')

  const lines: string[] = [
    `# ${title}`,
    '',
    `> ${summary}`,
    '',
    ...details.map(d => `- ${d}`),
    '',
  ]

  if (docs.length > 0) {
    lines.push(`## ${docsSection}`, '')
    for (const p of docs) {
      lines.push(`- [${p.title}](${baseUrl}/${p.srcPath}): ${p.llms_description}`)
    }
    lines.push('')
  }

  if (optional.length > 0) {
    lines.push(`## ${optionalSection}`, '')
    for (const p of optional) {
      lines.push(`- [${p.title}](${baseUrl}/${p.srcPath}): ${p.llms_description}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function buildLlmsFullTxt(pages: PageInfo[]): string {
  const { title, summary, details } = llmsConfig

  const lines: string[] = [
    `# ${title}`,
    '',
    `> ${summary}`,
    '',
    ...details.map(d => `- ${d}`),
  ]

  for (const page of pages) {
    const startsWithH1 = /^#\s+/.test(page.content)
    lines.push('', '---', '')
    if (!startsWithH1) {
      lines.push(`# ${page.title}`, '')
    }
    lines.push(page.content)
  }

  lines.push('')
  return lines.join('\n')
}

/** Strip frontmatter from a .md file and return clean content */
function stripFrontmatter(filePath: string): string {
  const raw = readFileSync(filePath, 'utf-8')
  const { content } = matter(raw)
  return content.trim() + '\n'
}

// Build-time generation (called from buildEnd)
export async function generateLlms(config: SiteConfig) {
  const { srcDir, outDir } = config

  // Per-page .md files for ALL pages (uses VitePress's own page list)
  for (const page of config.pages) {
    const outPath = path.join(outDir, page)
    mkdirSync(path.dirname(outPath), { recursive: true })
    writeFileSync(outPath, stripFrontmatter(path.join(srcDir, page)))
  }

  // llms.txt and llms-full.txt (filtered by llms frontmatter)
  const pages = sortPages(readPages(srcDir), getSidebarPaths(config))

  writeFileSync(path.join(outDir, 'llms.txt'), buildLlmsTxt(pages))
  writeFileSync(path.join(outDir, 'llms-full.txt'), buildLlmsFullTxt(pages))

  console.log(`✓ ${config.pages.length} per-page .md files generated`)
  console.log(`✓ llms.txt generated (${pages.length} docs)`)
  console.log(`✓ llms-full.txt generated`)
}

// Vite plugin for dev server
export function llmsPlugin(): Plugin {
  let docsRoot: string

  return {
    name: 'vitepress-llms-dev',
    configResolved(config) {
      docsRoot = config.root
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''

        if (url === '/llms.txt') {
          const pages = sortPages(readPages(docsRoot), [])
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(buildLlmsTxt(pages))
          return
        }

        if (url === '/llms-full.txt') {
          const pages = sortPages(readPages(docsRoot), [])
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(buildLlmsFullTxt(pages))
          return
        }

        // Serve per-page .md files (strip frontmatter)
        if (url.endsWith('.md')) {
          const filePath = path.join(docsRoot, url.slice(1))
          if (existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.end(stripFrontmatter(filePath))
            return
          }
        }

        next()
      })
    },
  }
}
