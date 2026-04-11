import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {defineConfig} from 'vitepress'
import {generateLlms, llmsPlugin} from './llms'
import {indexToTypesense} from './typesense-indexer.mts'

const themeDir = dirname(fileURLToPath(import.meta.url)) + '/theme'

// Internal: for indexing at build time (Docker hostname)
const typesenseHost = process.env.TYPESENSE_HOST || 'localhost'
const typesensePort = process.env.TYPESENSE_PORT || '8108'
const typesenseProtocol = process.env.TYPESENSE_PROTOCOL || 'http'
const typesenseAdminKey = process.env.TYPESENSE_API_KEY || 'buggregator-dev-key'
const typesenseCollection = process.env.TYPESENSE_COLLECTION || 'buggregator_docs'
const docsHostname = process.env.DOCS_HOSTNAME || 'https://docs.buggregator.dev'
const typesenseIndexingEnabled = process.env.TYPESENSE_INDEXING !== 'false'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    ignoreDeadLinks: true,
    title: "Buggregator docs",
    description: "Buggregator docs",
    vite: {
        define: {
            'process.env': {},
        },
        server: {
            proxy: {
                '/api/search': {
                    target: `${typesenseProtocol}://${typesenseHost}:${typesensePort}`,
                    changeOrigin: true,
                    rewrite: (path: string) => {
                        const qs = path.includes('?') ? path.substring(path.indexOf('?')) : ''
                        return `/collections/${typesenseCollection}/documents/search${qs}`
                    },
                    configure: (proxy) => {
                        proxy.on('proxyReq', (proxyReq) => {
                            proxyReq.setHeader('X-TYPESENSE-API-KEY', typesenseAdminKey)
                        })
                    },
                },
            },
        },
        plugins: [
            llmsPlugin(),
            // Override VitePress search with our custom DocSearch component
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
                    {text: 'Monolog', link: '/config/monolog'},
                    {text: 'VarDumper', link: '/config/var-dumper'},
                    {text: 'Ray', link: '/config/ray'},
                    {text: 'Inspector', link: '/config/inspector'},
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
