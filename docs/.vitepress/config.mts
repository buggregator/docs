import {defineConfig} from 'vitepress'
import {generateLlms, llmsPlugin} from './llms'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    ignoreDeadLinks: true,
    title: "Buggregator docs",
    description: "Buggregator docs",
    vite: {
        plugins: [llmsPlugin()],
    },
    buildEnd: async (config) => {
        await generateLlms(config)
    },
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        search: {
            provider: 'local'
        },

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
