---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Buggregator docs"
  text: "A VitePress Site"
  tagline: My great project tagline
  actions:
    - theme: brand
      text: Markdown Examples
      link: /markdown-examples
    - theme: alt
      text: API Examples
      link: /api-examples
---

<script setup>
import {
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamMembers
} from 'vitepress/theme';

const members = [
  {
    avatar: 'https://www.github.com/butschster.png',
    name: 'butschster',
    title: 'Creator',
    links: [
      { icon: 'github', link: 'https://github.com/butschster' },
      { icon: 'twitter', link: 'https://twitter.com/butsch' }
    ]
  },
{
    avatar: 'https://www.github.com/roxblnfk.png',
    name: 'roxblnfk',
    title: 'Maintainer',
    links: [
      { icon: 'github', link: 'https://github.com/roxblnfk' },
      { icon: 'twitter', link: 'https://twitter.com/roxblnfk' }
    ]
  },
]
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>
      Our Team
    </template>
    <template #lead>
      The development of VitePress is guided by an international
      team, some of whom have chosen to be featured below.
    </template>
  </VPTeamPageTitle>
  <VPTeamMembers
    :members="members"
  />
</VPTeamPage>