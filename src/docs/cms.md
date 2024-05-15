---
eleventyNavigation:
  parent: Getting Started
  key: Using a CMS
  order: 10
featuredCmses:
  - name: CloudCannon
    url: https://cloudcannon.com/eleventy-cms/?utm_campaign=11ty-partner&utm_source=official-sponsor
    tags: [Recommended Partner, Git-based]
    class: sites-featured
    screenshotOverride:
      src: "/img/screenshot-fallbacks/cloudcannon-cms.png"
      alt: "The Eleventy CMS for Visual Editing, CloudCannon CMS"
cmses:
  - name: WordPress REST API
    url: https://developer.wordpress.org/rest-api/
    screenshotSize: medium
    tags: [API]
  - name: Strapi
    url: https://strapi.io/
    screenshotSize: medium
    tags: [API]
  - name: Contentful
    url: https://www.contentful.com/
    screenshotSize: medium
    tags: [API]
  - name: Sanity
    url: https://www.sanity.io/
    screenshotSize: medium
    tags: [API]
  - name: Notion
    url: https://developers.notion.com/
    screenshotSize: medium
    tags: [API]
  - name: DecapCMS
    url: https://decapcms.org/
    screenshotSize: medium
    tags: [Git-based]
  - name: Spinal
    url: https://spinalcms.com/
    screenshotSize: medium
    tags: [Git-based]
  - name: Wix Headless
    url: https://www.wix.com/developers/headless/
    tags: [API]
  - name: Storyblok
    url: https://www.storyblok.com/
    screenshotSize: medium
    tags: [API]
  - name: Webflow CMS
    url: https://webflow.com/cms
    tags: [API]
  - name: Prismic
    url: https://prismic.io/
    screenshotSize: medium
    tags: [API]
  - name: Ghost
    url: https://ghost.org/
    tags: [API]
  - name: Agility CMS
    url: https://agilitycms.com/
    screenshotSize: medium
    tags: [API]
  - name: Builder.io
    url: https://www.builder.io/
    screenshotSize: medium
    tags: [API]
  - name: Publii
    url: https://getpublii.com/
    screenshotSize: medium
    tags: [Git-based]
  - name: Directus
    url: https://directus.io/
    screenshotSize: medium
    tags: [API]
---

# 使用 CMS

{% tableofcontents %}

_内容管理系统_ （CMS）为你的网站添加了一个基于 Web 的界面，使技术人员和非技术人员都可以轻松的随时随地更新网站。

Eleventy（像大多数站点生成器一样）与任何特定 CMS 都不紧密耦合，并且提供了与各种可用的行业和社区选项一起工作的灵活性！以这种方式解耦的内容管理系统被称为_Headless_。

对于熟悉更紧密耦合/整体选项的开发人员来说，使用 Headless CMS 提供了多种好处，其中，前端和后端相互依赖。

主要的是，使用 Headless 使开发人员可以更好地控制前端。这减轻了整体选项常见的前端性能和可访问性问题。值得注意的是，传统紧密耦合的解决方案（如 Drupal、Joomla 或 WordPress）也开始提供 Headless 选项。

## 无头 CMS 的类型

深入研究，有两种主要的 Headless CMS 选项：

1. **源代码控制**：将文件直接检入你的代码存储库（`git`是一个非常受欢迎的代码存储库）。你可能会听到它们称为基于 Git 的 CMS 解决方案。这种方法有一些优点：
   - 你的数据和内容已经有了版本控制。
   - 与你现有的部署过程一起按原样工作，包括分支/测试/预生产部署预览。
   - 如果你决定更换提供商，则不需要进行数据迁移——它[已内嵌 (未油炸)](http://www.aaronsw.com/weblog/000404)。
2. **基于 API**：提供了一个外部 API，可以在你的构建或无服务器函数中查询。这种方法使你可以访问强大的查询语言，从而可以解锁对复杂数据结构的访问。

## 无头 CMS 提供商

<div class="sites-vert sites-vert--md sites--reverse sites--center">
  <div class="lo-grid" style="--fl-gap-v: 5em;">
{%- for site in featuredCmses %}
{% include "site-card.njk" %}
{%- endfor %}
{%- for site in cmses | shuffle %}
{% include "site-card.njk" %}
{%- endfor %}
  </div>
</div>

_上面的列表并非详尽的。_

## 相关

<div class="youtube-related">
  {%- youtubeEmbed "yXcxvBJuULU", "使用 CloudCannon 和 Eleventy 在 2 分钟内从零开始到 CMS" -%}
</div>

### 来自社区

<ul class="list-bare">
	<li>{% indieweblink "Jamstack.org 上的无头 CMS 列表", "https://jamstack.org/headless-cms/" %}</li>
	<li>{% indieweblink "如何使用 11ty (Eleventy) 博客入门", "https://www.sanity.io/guides/how-to-get-started-with-the-11ty-eleventy-blog-starter" %}</li>
</ul>

{% include "11tybundle.njk" %}