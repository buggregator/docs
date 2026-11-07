import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {defineConfig} from 'vitepress'
import {generateLlms, llmsPlugin} from './llms'
import {TypesenseSearchPlugin} from 'vitepress-plugin-typesense'
import {indexToTypesense} from './typesense-indexer.mts'

const themeDir = dirname(fileURLToPath(import.meta.url)) + '/theme'

// Internal: for indexing at build time (Docker hostname)
const typesenseHost = process.env.TYPESENSE_HOST || 'localhost'
const typesensePort = process.env.TYPESENSE_PORT || '8108'
const typesenseProtocol = process.env.TYPESENSE_PROTOCOL || 'http'
const typesenseAdminKey = process.env.TYPESENSE_API_KEY || 'buggregator-dev-key'

// Public: for browser search (accessible from user's browser)
const typesensePublicHost = process.env.TYPESENSE_PUBLIC_HOST || typesenseHost
const typesensePublicPort = process.env.TYPESENSE_PUBLIC_PORT || typesensePort
const typesensePublicProtocol = process.env.TYPESENSE_PUBLIC_PROTOCOL || typesenseProtocol
const typesenseSearchKey = process.env.TYPESENSE_SEARCH_KEY || typesenseAdminKey
const typesenseCollection = process.env.TYPESENSE_COLLECTION || 'buggregator_docs'
const docsHostname = process.env.DOCS_HOSTNAME || 'https://docs.buggregator.dev'
const typesenseIndexingEnabled = process.env.TYPESENSE_INDEXING !== 'false'

const siteUrl = 'https://docs.buggregator.dev'
const gaId = 'G-T3KSNEP67B'

// Short page description for search results: frontmatter `description`, else the
// start of `llms_description` cut at a word boundary (max 155 characters).
function pageDescription(fm: Record<string, any>, fallback: string): string {
    if (fm.description) return String(fm.description)
    if (!fm.llms_description) return fallback
    const text = String(fm.llms_description).trim()
    if (text.length <= 155) return text
    const cut = text.slice(0, 154)
    return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.]+$/, '') + '…'
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
    ignoreDeadLinks: true,
    title: "Buggregator docs",
    description: "Buggregator docs",
    sitemap: {hostname: siteUrl},
    head: [
        ['script', {async: '', src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`}],
        ['script', {}, `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`],
    ],
    transformPageData(pageData) {
        pageData.description = pageDescription(pageData.frontmatter, pageData.description)
    },
    transformHead({pageData}) {
        const path = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html')
        const url = `${siteUrl}/${path}`
        return [
            ['link', {rel: 'canonical', href: url}],
            ['link', {rel: 'alternate', type: 'text/markdown', href: '/' + pageData.relativePath}],
            ['meta', {property: 'og:type', content: 'website'}],
            ['meta', {property: 'og:title', content: pageData.title || 'Buggregator docs'}],
            ['meta', {property: 'og:description', content: pageData.description}],
            ['meta', {property: 'og:url', content: url}],
            ['meta', {property: 'og:image', content: 'https://buggregator.dev/buggregator.png'}],
        ]
    },
    vite: {
        define: {
            'process.env': {},
        },
        plugins: [
            llmsPlugin(),
            TypesenseSearchPlugin({
                typesenseCollectionName: typesenseCollection,
                typesenseServerConfig: {
                    apiKey: typesenseSearchKey,
                    nodes: [{
                        host: typesensePublicHost,
                        port: typesensePublicPort,
                        protocol: typesensePublicProtocol,
                    }],
                },
                // Indexing disabled — we use our custom indexer (typesense-indexer.mts)
                // that also indexes code blocks and stores HTML excerpts.
                indexing: {
                    enabled: false,
                    failBuildOnDocumentIndexingError: false,
                },
            }),
            // Override the plugin's Search.vue with our custom DocSearch component
            {
                name: 'custom-search-override',
                config() {
                    return {
                        resolve: {
                            alias: {
                                './VPNavBarSearch.vue': join(themeDir, 'DocSearch.vue'),
                                './VPNavBarSearchButton.vue': join(themeDir, 'EmptySearch.vue'),
                            },
                        },
                    }
                },
            },
        ],
    },
    buildEnd: async (config) => {
        await generateLlms(config)
        try {
            await indexToTypesense(config, typesenseCollection, {
                enabled: typesenseIndexingEnabled,
                hostname: docsHostname,
                typesenseServerConfig: {
                    apiKey: typesenseAdminKey,
                    nodes: [{
                        host: typesenseHost,
                        port: typesensePort,
                        protocol: typesenseProtocol,
                    }],
                },
            })
        } catch (e) {
            console.warn('⚠️ [Typesense] Indexing failed (non-fatal):', (e as Error).message)
        }
    },
    themeConfig: {
        nav: [
            {text: 'Docs', link: '/'},
            {text: 'buggregator.dev', link: 'https://buggregator.dev'},
        ],

        sidebar: [
            {
                text: 'What is Buggregator?',
                link: '/',
            },
            {
                text: 'Getting Started',
                link: '/getting-started',
            },
            {
                text: 'Install the Binary',
                link: '/install',
            },
            {
                text: 'Set Up with an AI Agent',
                link: '/agent-setup',
            },
            {
                text: 'For LLM',
                link: '/llm',
            },

            {
                text: 'Trap',
                items: [
                    {
                        text: 'What is Trap?',
                        link: '/trap/what-is-trap',
                    },
                    {
                        text: 'Getting Started',
                        link: '/trap/getting-started',
                    },
                    {
                        text: 'Commands',
                        link: '/trap/commands',
                    },
                    {
                        text: 'Usage',
                        link: '/trap/usage',
                    }
                ]
            },

            {
                text: 'Integrations',
                items: [
                    {text: 'XHProf Profiler', link: '/config/xhprof'},
                    {text: 'Sentry', link: '/config/sentry'},
                    {text: 'SMTP Server', link: '/config/smtp'},
                    {text: 'SMS Gateway', link: '/config/sms'},
                    {text: 'HTTP Dumps', link: '/config/http-dumps'},
                    {text: 'HTTP Proxy', link: '/config/http-proxy'},
                    {text: 'Mock Server', link: '/config/mock-server'},
                    {text: 'Mock Templates', link: '/config/mock-templates'},
                    {text: 'Monolog', link: '/config/monolog'},
                    {text: 'VarDumper', link: '/config/var-dumper'},
                    {text: 'Ray', link: '/config/ray'},
                    {text: 'Inspector', link: '/config/inspector'},
                    {text: 'Xdebug Proxy', link: '/config/xdebug'},
                    {text: 'JetBrains IDE Plugin', link: '/config/phpstorm-plugin'},
                ]
            },

            {
                text: 'Configuration',
                items: [
                    {text: 'Server', link: '/config/server'},
                    {text: 'Database', link: '/config/database'},
                    {text: 'Projects', link: '/config/projects'},
                    {text: 'Webhooks', link: '/config/webhooks'},
                    {text: 'Single Sign On (SSO)', link: '/config/sso'},
                    {text: 'MCP (AI Assistants)', link: '/config/mcp'},
                    {text: 'Installable App (PWA)', link: '/config/pwa'},
                    {text: 'Helm Chart', link: '/config/helm-chart'},
                    {text: 'Metrics', link: '/config/metrics'},
                ]
            },

            {
                text: 'Cookbook',
                items: [
                    {text: 'Dev environment using docker', link: '/cookbook/docker-install'},
                    {text: 'Manual installation', link: '/cookbook/manual-install'},
                ]
            },

            {
                text: 'Contributing',
                items: [
                    {
                        text: 'Getting Started',
                        link: '/contributing',
                    },
                    {
                        text: 'Server',
                        link: '/contributing/server',
                    },
                    {
                        text: 'Frontend',
                        link: '/contributing/frontend',
                    },
                    {
                        text: 'Documentation',
                        link: '/contributing/docs',
                    },
                ]
            },
        ],

        socialLinks: [
            {icon: 'github', link: 'https://github.com/buggregator/server'},
            {icon: 'discord', link: 'https://discord.gg/vDsCD3EKUB'},
            {icon: 'twitter', link: 'https://twitter.com/buggregator'},
        ]
    }
})
