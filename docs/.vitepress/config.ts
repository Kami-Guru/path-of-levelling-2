import { defineConfig } from 'vitepress'

const BASE = '/path-of-levelling-2/'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Path of Levelling 2",
  description: "A Path of Exile 2 levelling overlay",
  base: BASE,
  mpa: true,
  head: [['link', {rel: 'shortcut icon', Text: 'test'}]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Github', link: 'https://github.com/Kami-Guru/path-of-levelling-2' },
      { text: 'Releases', link: 'https://github.com/Kami-Guru/path-of-levelling-2/releases' }
    ],

    sidebar: [
      {
        items: [
          { text: 'Download', link: '/' },
          { text: 'Quick Start Guide', link: '/quick-start' }
        ]
      },
      {
        items: [
          { text: 'Common Issues', link: '/common-issues' },
          { text: 'FAQ', link: '/faq' }
        ]
      }
    ]
  }
})
