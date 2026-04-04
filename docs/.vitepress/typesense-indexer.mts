/**
 * Custom Typesense indexer for VitePress docs.
 *
 * Unlike the default vitepress-plugin-typesense indexer, this one:
 * - Indexes code blocks (<pre>) so CLI commands, config, and code are searchable
 * - Stores raw HTML excerpts (`html_content`) for rich result rendering
 * - Marks records with `content_type` ("text" | "code") for UI differentiation
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Client } from 'typesense'
import * as cheerio from 'cheerio'
import matter from 'gray-matter'
import type { SiteConfig } from 'vitepress'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IndexingConfig {
    enabled: boolean
    hostname: string
    typesenseServerConfig: {
        apiKey: string
        nodes: { host: string; port: string; protocol: string }[]
    }
}

interface DocRecord {
    objectID: string
    url: string
    url_without_anchor: string
    anchor: string | null
    content: string | null
    content_type: string
    html_content: string
    type: string
    language: string
    item_priority: number
    [key: string]: any
}

// ---------------------------------------------------------------------------
// HTML parser — includes code blocks + stores HTML excerpts
// ---------------------------------------------------------------------------

const CONTENT_SELECTOR = '.vp-doc p, .vp-doc ul, .vp-doc ol, .vp-doc table, .vp-doc pre'

function getRecords(
    html: string,
    pageUrl: string,
    frontmatter: any,
    language: string,
): DocRecord[] {
    const $ = cheerio.load(html)
    const records: DocRecord[] = []

    const lvl0 = frontmatter.title || $('.VPNavBarTitle').text() || $('title').text() || 'Documentation'

    const headingSel = '.vp-doc h1, .vp-doc h2, .vp-doc h3, .vp-doc h4, .vp-doc h5, .vp-doc h6'
    const allSel = `${headingSel}, ${CONTENT_SELECTOR}`
    const elements = $(allSel)

    const hierarchy: { [key: string]: string | null } = { lvl0, lvl1: null, lvl2: null, lvl3: null, lvl4: null, lvl5: null, lvl6: null }
    const anchors: { [key: string]: string | null } = { lvl0: null, lvl1: null, lvl2: null, lvl3: null, lvl4: null, lvl5: null, lvl6: null }

    elements.each((pos, el) => {
        const $el = $(el)
        const tag = el.tagName?.toLowerCase() ?? ''
        const level = getLevelFromTag(tag)

        if (level.startsWith('lvl')) {
            // Heading — update hierarchy
            const text = cleanText($el, $)
            const lvlIndex = parseInt(level.replace('lvl', ''), 10)
            hierarchy[level] = text
            anchors[level] = $el.attr('id') || null

            for (let i = lvlIndex + 1; i <= 6; i++) {
                hierarchy[`lvl${i}`] = null
                anchors[`lvl${i}`] = null
            }

            // Also create a record for the heading itself so it appears in search
            if (text) {
                const closestAnchor = $el.attr('id') || getClosestAnchor(anchors)
                const hier = { ...hierarchy }
                const hierRadio = getHierarchyRadio(hier)
                const levelWeight = 100 - lvlIndex * 10

                const rec: DocRecord = {
                    objectID: '',
                    url_without_anchor: pageUrl,
                    url: closestAnchor ? `${pageUrl}#${closestAnchor}` : pageUrl,
                    anchor: closestAnchor,
                    content: text,
                    content_type: 'heading',
                    html_content: '',
                    ...flattenHierarchy(hier),
                    type: level,
                    language,
                    item_priority: (frontmatter.order || 0) * 1_000_000_000 + (levelWeight + 50) * 1_000 + (elements.length - pos),
                    _position: pos,
                }
                rec.objectID = hashRecord(rec)
                delete rec._position
                records.push(rec)
            }

            return
        }

        // Content element (p, ul, ol, table, pre)
        const isCode = tag === 'pre'
        const text = cleanText($el, $)
        if (!text) return

        // Store raw HTML for rich display in search results.
        // For code blocks: keep the <pre> with syntax-highlighting spans.
        // For text: keep the inner HTML (links, inline code, bold, etc).
        let htmlContent = ''
        if (isCode) {
            // Get the outer HTML of the <pre> element (includes <code> with highlight spans)
            // Clone and strip VitePress copy button and line-number elements
            const $clone = $el.clone()
            $clone.find('button').remove()
            $clone.find('.line-numbers-wrapper').remove()
            htmlContent = $.html($clone) || ''
        } else {
            htmlContent = $el.html() || ''
        }

        // Trim HTML to ~2000 chars to keep index size reasonable
        if (htmlContent.length > 2000) {
            htmlContent = htmlContent.substring(0, 2000) + '…'
        }

        const closestAnchor = getClosestAnchor(anchors)
        const hier = { ...hierarchy }
        const hierRadio = getHierarchyRadio(hier)

        const lvlIndex = getDeepestLevel(hier)
        const levelWeight = 100 - lvlIndex * 10

        const rec: DocRecord = {
            objectID: '',
            url_without_anchor: pageUrl,
            url: closestAnchor ? `${pageUrl}#${closestAnchor}` : pageUrl,
            anchor: closestAnchor,
            content: text,
            content_type: isCode ? 'code' : 'text',
            html_content: htmlContent,
            ...flattenHierarchy(hier),
            ...flattenHierarchy(hierRadio, 'hierarchy_radio'),
            type: 'content',
            language,
            item_priority: (frontmatter.order || 0) * 1_000_000_000 + levelWeight * 1_000 + (elements.length - pos),
            _position: pos,
        }

        rec.objectID = hashRecord(rec)
        delete rec._position
        records.push(rec)
    })

    return records
}

function getLevelFromTag(tag: string): string {
    if (/^h[1-6]$/.test(tag)) return `lvl${tag.replace('h', '')}`
    return 'content'
}

function cleanText($el: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
    const clone = $el.clone()
    clone.find('.header-anchor').remove()
    let text = clone.text()
    text = text
        .replace(/\u00A0/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    return text
}

function getClosestAnchor(anchors: { [key: string]: string | null }): string | null {
    for (let i = 6; i >= 0; i--) {
        if (anchors[`lvl${i}`]) return anchors[`lvl${i}`]
    }
    return null
}

function getDeepestLevel(hier: { [key: string]: string | null }): number {
    for (let i = 6; i >= 0; i--) {
        if (hier[`lvl${i}`]) return i
    }
    return 0
}

function getHierarchyRadio(hier: { [key: string]: string | null }): { [key: string]: string | null } {
    const radio: { [key: string]: string | null } = { lvl0: null, lvl1: null, lvl2: null, lvl3: null, lvl4: null, lvl5: null, lvl6: null }
    for (let i = 6; i >= 0; i--) {
        const key = `lvl${i}`
        if (hier[key] !== null) {
            radio[key] = hier[key]
            break
        }
    }
    return radio
}

/**
 * Flatten hierarchy into dot-notation fields for Typesense.
 * { lvl0: "A", lvl1: "B" } → { "hierarchy.lvl0": "A", "hierarchy.lvl1": "B" }
 */
function flattenHierarchy(hier: { [key: string]: string | null }, prefix: string = 'hierarchy'): { [key: string]: string | null } {
    const flat: { [key: string]: string | null } = {}
    for (const [k, v] of Object.entries(hier)) {
        flat[`${prefix}.${k}`] = v
    }
    return flat
}

function hashRecord(rec: DocRecord): string {
    const obj: any = {}
    for (let i = 0; i <= 6; i++) {
        const val = rec[`hierarchy.lvl${i}`]
        if (val) obj[`lvl${i}`] = val
    }
    const pos = rec._position ?? 0
    const data = { hierarchy: obj, url: rec.url_without_anchor, position: pos }
    return crypto.createHash('sha1').update(JSON.stringify(data, Object.keys(data).sort())).digest('hex')
}

// ---------------------------------------------------------------------------
// Typesense collection management
// ---------------------------------------------------------------------------

function createClient(config: IndexingConfig['typesenseServerConfig']): Client {
    return new Client({
        apiKey: config.apiKey,
        nodes: config.nodes.map(n => ({
            host: n.host,
            port: parseInt(n.port, 10),
            protocol: n.protocol,
        })),
        connectionTimeoutSeconds: 1800,
        retryIntervalSeconds: 1,
        numRetries: 3,
    })
}

async function createCollection(client: Client, name: string) {
    try { await client.collections(name).delete() } catch (e: any) { if (e?.httpStatus !== 404) throw e }

    await client.collections().create({
        name,
        fields: [
            { name: 'anchor', type: 'string', optional: true },
            { name: 'content', type: 'string', locale: 'en', optional: true },
            { name: 'content_type', type: 'string', facet: true, optional: true },
            { name: 'html_content', type: 'string', index: false, optional: true },
            { name: 'url', type: 'string', facet: true },
            { name: 'url_without_anchor', type: 'string', facet: true, optional: true },
            { name: 'version', type: 'string[]', facet: true, optional: true },
            ...Array.from({ length: 7 }).map((_, i) => ({
                name: `hierarchy.lvl${i}`, type: 'string' as const, facet: true, locale: 'en', optional: true,
            })),
            { name: 'type', type: 'string', facet: true, locale: 'en', optional: true },
            { name: 'language', type: 'string', facet: true, optional: true },
            { name: 'tags', type: 'string[]', facet: true, locale: 'en', optional: true },
            { name: 'item_priority', type: 'int64' },
        ],
        default_sorting_field: 'item_priority',
        token_separators: ['_', '-'],
    })
}

async function uploadRecords(client: Client, collectionName: string, records: DocRecord[]) {
    for (let i = 0; i < records.length; i += 50) {
        const batch = records.slice(i, i + 50)
        const results = await client.collections(collectionName).documents().import(batch, { action: 'create' })
        const failures = results.filter((r: any) => r.success === false)
        if (failures.length > 0) {
            console.error('Typesense Import Failed:', JSON.stringify(failures, null, 2))
            throw new Error('Failed to import some records')
        }
    }
}

async function swapAlias(client: Client, aliasName: string, newCollectionName: string) {
    let oldCollection: string | null = null
    try {
        const alias = await client.aliases(aliasName).retrieve()
        oldCollection = alias.collection_name
    } catch (e: any) { if (e?.httpStatus !== 404) throw e }

    await client.aliases().upsert(aliasName, { collection_name: newCollectionName })

    if (oldCollection) {
        try { await client.collections(oldCollection).delete() } catch { /* ignore */ }
    }
}

// ---------------------------------------------------------------------------
// Main entry point — called from VitePress buildEnd
// ---------------------------------------------------------------------------

export async function indexToTypesense(
    siteConfig: SiteConfig,
    collectionName: string,
    indexingConfig: IndexingConfig,
) {
    if (!indexingConfig.enabled) return

    console.log('⚡ [Typesense] Starting indexing (with code blocks + HTML excerpts)...')

    const client = createClient(indexingConfig.typesenseServerConfig)
    const tmpName = `${collectionName}_${Date.now()}`

    await createCollection(client, tmpName)

    const allRecords: DocRecord[] = []
    const { pages, srcDir, outDir, cleanUrls, site } = siteConfig

    for (const page of pages) {
        if (page === '404.md') continue

        const srcFile = path.join(srcDir, page)
        const raw = fs.readFileSync(srcFile, 'utf-8')
        const { data: fm } = matter(raw)
        if (fm.search === false) continue

        const htmlPath = page.replace(/\.md$/, '.html')
        const outFile = path.join(outDir, htmlPath)
        if (!fs.existsSync(outFile)) {
            console.warn(`⚠️ [Typesense] Missing: ${outFile}`)
            continue
        }

        const html = fs.readFileSync(outFile, 'utf-8')

        let slug = page.replace(/\.md$/, '')
        if (!cleanUrls && slug !== 'index') slug += '.html'
        if (slug.endsWith('index')) slug = slug.replace(/index$/, '')

        const pageUrl = `${indexingConfig.hostname || ''}/${slug}`.replace(/([^:]\/)\//g, '$1')

        let lang = 'en-US'
        if (site.locales?.root?.lang) lang = site.locales.root.lang
        else if (site.lang) lang = site.lang

        const records = getRecords(html, pageUrl, fm, lang)
        allRecords.push(...records)
    }

    const codeRecords = allRecords.filter(r => r.content_type === 'code').length
    const textRecords = allRecords.filter(r => r.content_type === 'text').length
    const headingRecords = allRecords.filter(r => r.content_type === 'heading').length
    console.log(`⚡ [Typesense] ${allRecords.length} records (${headingRecords} headings, ${textRecords} text, ${codeRecords} code)`)

    await uploadRecords(client, tmpName, allRecords)
    await swapAlias(client, collectionName, tmpName)

    console.log('✅ [Typesense] Indexing complete.')
}
