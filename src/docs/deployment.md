---
eleventyNavigation:
  parent: Getting Started
  key: Deployment
  title: "Deployment & Hosting"
  order: 8
featuredHosts:
  - name: "Want your logo here? Contact us!"
    url: ""
    tags: [Hosting Partner]
    class: sites-featured
    screenshotSize: opengraph
hosts:
  - name: Cloudflare Pages
    url: https://pages.cloudflare.com/
    iconUrl: https://www.cloudflare.com/
    screenshotSize: medium
  - name: Netlify
    url: https://app.netlify.com/
    screenshotSize: medium
  - name: Vercel
    url: https://vercel.com/signup
    screenshotSize: medium
  - name: Stormkit
    url: https://stormkit.io/
    screenshotSize: medium
  - name: GitHub Pages
    url: https://pages.github.com/
    screenshotSize: medium
  - name: GitLab Pages
    url: https://docs.gitlab.com/ee/user/project/pages/
    screenshotSize: medium
  - name: Render
    url: https://render-web.onrender.com/
    screenshotSize: medium
  - name: Azure Static Web Apps
    url: https://azure.microsoft.com/en-us/services/app-service/static/
    screenshotSize: medium
    skipIcon: true
  - name: Edgio
    url: https://docs.edg.io/guides/v7/sites_frameworks/getting_started/eleventy
    screenshotSize: medium
  - name: Begin
    url: https://begin.com/
    screenshotSize: medium
  - name: Digital Ocean
    url: https://www.digitalocean.com/community/tutorials/how-to-create-and-deploy-your-first-eleventy-website
    screenshotSize: medium
  - name: Codeberg Pages
    url: https://codeberg.page/
    screenshotSize: medium
  - name: Kinsta
    url: https://kinsta.com/
    screenshotSize: medium
  - name: CloudCannon
    url: https://cloudcannon.com/hosting/
    screenshotSize: medium
  - name: Sourcehut Pages
    url: https://srht.site/
    screenshotSize: medium
classicHosts:
  - name: NearlyFreeSpeech
    url: https://www.nearlyfreespeech.net/
    screenshotSize: medium
  - name: Netlify Drop
    url: https://app.netlify.com/drop
    screenshotSize: medium
  - name: Neocities
    url: https://neocities.org/
    screenshotSize: medium
    skipIcon: true
  - name: yay.boo
    url: https://yay.boo/
    screenshotSize: medium
  - name: Cloudflare Direct Upload
    url: https://developers.cloudflare.com/pages/get-started/direct-upload/#drag-and-drop
    screenshotSize: medium
webides:
  - name: Glitch
    url: https://glitch.com/
    screenshotSize: medium
    hideRelatedLinks: true
  - name: Stackblitz
    url: https://stackblitz.com/
    screenshotSize: medium
    hideRelatedLinks: true
---

# 部署

{% tableofcontents %}

现在你已经使用 Eleventy 构建了一个网站（甚至是单个 HTML 页面），接下来你可能希望把它放在网络上让大家都能看到！有很多不同的方法可以做到这一点！

默认情况下，标准的 Eleventy 构建（例如 [运行 `npx @11ty/eleventy`](/docs/usage/)）是 **生产就绪构建**。Eleventy 不会为开发和生产而改变其内部构建行为。

如果你想自定义 Eleventy 来执行自己的本地开发/生产优化，那么 [环境变量](/docs/environment-vars/) 是实现该目标的常用解决方案。

## 提供商

看看下面的列表，了解将你的 Eleventy 项目部署到何处的想法。有许多部署选项可用，这并非一份详尽的列表。

### 经典 Web 主机

Eleventy 可以与支持静态文件的任何 Web 主机协同工作！

使用这些主机，部署 **不会** 自动触发，因此在你运行 Eleventy 构建命令后，你需要手动将 [Eleventy 输出目录](/docs/config/#output-directory)（默认为 `_site`）上传到主机。

如果你不熟悉源代码控制（例如 git 或 GitHub），这是个不错的起点。

<div class="sites-vert sites-vert--md sites--reverse sites--center">
  <div class="lo-grid" style="--fl-gap-v: 5em;">
{%- for site in classicHosts | shuffle %}
{% include "site-card.njk" %}
{%- endfor %}
  </div>
</div>

### Jamstack 提供商

当你将文件提交到你的源代码存储库（GitHub、GitLab、Codeberg 等）时，Jamstack 提供商可以自动触发你的 Eleventy 构建命令，并为你部署 [Eleventy 的构建输出目录](/docs/config/#output-directory)。

<div class="sites-vert sites-vert--md sites--reverse sites--center">
  <div class="lo-grid" style="--fl-gap-v: 5em;">
{# {%- for site in featuredHosts %}
{% include "site-card.njk" %}
{%- endfor %} #}
{%- for site in hosts | shuffle %}
{% include "site-card.njk" %}
{%- endfor %}
  </div>
</div>

#### 使用 npm 脚本

通过 Jamstack 提供商部署 Eleventy 时的一个常见做法是使用 npm 脚本运行构建命令。这是在 `package.json` 文件中配置的，可能如下所示：

{% codetitle "package.json" %}

```js
{
  "scripts": {
    "build": "npx @11ty/eleventy"
  }
}
```

这使你能够配置你的主机来运行 `npm run build`，并允许你在代码中对该命令做出未来的更改，而不是主机配置。

### 网页编辑

有一些很棒的 Web 编辑器可以让你在线运行和编辑 Eleventy 项目！以下是几个选项：

<div class="sites-vert sites-vert--md sites--reverse sites--center">
  <div class="lo-grid" style="--fl-gap-v: 5em;">
{%- for site in webides %}
{% set hideRelatedLinks = site.hideRelatedLinks %}
{% include "site-card.njk" %}
{%- endfor %}
  </div>
</div>

## 保留缓存

[Eleventy Fetch 插件](/docs/plugins/fetch/)（以及 [Eleventy Image](/docs/plugins/image/#advanced-caching-options-for-remote-images)）使用 `.cache` 文件夹来避免重复昂贵的网络请求。在你的托管提供商的构建服务器上，当你启动构建时，此文件夹通常是空的，因为你 **肯定没有将你的 `.cache` 文件夹检入到 `git`（对吧？）**。

一些 Jamstack 提供商具有其他功能，可以在构建之间保留此文件夹，重新使用缓存并加快构建速度。以下列举了几个：

- **CloudCannon**：使用 [保留路径](https://cloudcannon.com/documentation/articles/caching-specific-folders-to-reduce-build-times/#preserved-paths)。[YouTube 上的教程](https://www.youtube.com/watch?v=ULwVlFMth1U)。
- **Vercel**：零配置支持（[当检测到 Eleventy 框架](https://vercel.com/docs/deployments/configure-a-build#framework-preset) 时，[源代码](https://github.com/vercel/vercel/blob/20237d4f7b55b0697b57db15636c11204cb0dc39/packages/frameworks/src/frameworks.ts#L363)）。
- [**Cloudflare Pages**](https://developers.cloudflare.com/pages/configuration/build-caching/#frameworks)：_尚未支持_，但我们一直在与团队合作添加它——敬请期待！
- **GitHub Pages**：使用 [`cache` 操作](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows#using-the-cache-action)。[下面包含小教程](#deploy-an-eleventy-project-to-github-pages)
- **Netlify**：使用 [`netlify-plugin-cache`](https://www.npmjs.com/package/netlify-plugin-cache)。[下面包含小教程](#using-netlify-plugin-cache-to-persist-cache)。[YouTube 上的视频](https://www.youtube.com/watch?v=JCQQgtOcjH4&t=322s)。

### 加快 Eleventy Image
