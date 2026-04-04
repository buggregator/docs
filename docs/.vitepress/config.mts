import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {defineConfig} from 'vitepress'
import {generateLlms, llmsPlugin} from './llms'
import {TypesenseSearchPlugin} from 'vitepress-plugin-typesense'

const themeDir = dirname(fileURLToPath(import.meta.url)) + '/theme'

// Internal: for indexing at build time (Docker hostname)
const typesenseHost = process.env.TYPESENSE_HOST || 'localhost'
const typesensePort = process.env.TYPESENSE_PORT || '8108'
const typesenseProtocol = process.env.TYPESENSE_PROTOCOL || 'http'
const typesenseAdminKey = process.env.TYPESENSE_API_KEY || 'buggregator-search-key'

// Public: for browser search (accessible from user's browser)
const typesensePublicHost = process.env.TYPESENSE_PUBLIC_HOST || typesenseHost
const typesensePublicPort = process.env.TYPESENSE_PUBLIC_PORT || typesensePort
const typesensePublicProtocol = process.env.TYPESENSE_PUBLIC_PROTOCOL || typesenseProtocol
const typesenseSearchKey = process.env.TYPESENSE_SEARCH_KEY || typesenseAdminKey
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
        resolve: {
            alias: {
                // Override plugin's Search.vue with empty component — we use our own DocSearch in Layout
                './VPNavBarSearch.vue': join(themeDir, 'EmptySearch.vue'),
                './VPNavBarSearchButton.vue': join(themeDir, 'EmptySearch.vue'),
            },
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
                indexing: {
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
                },
            }),
        ],
    },
    buildEnd: async (config) => {
        await generateLlms(config)
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
