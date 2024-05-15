---
eleventyNavigation:
  parent: Getting Started
  key: Command Line Usage
  order: 1
---

# 命令行用法

**先决条件：**

1. Eleventy 在终端窗口中运行。[_呃，等一下——什么是终端窗口？_](/docs/terminal-window/)
2. 您已经 [安装了 Eleventy](/docs/) 了吗？

---

以下是您可以在终端窗口中输入的第一个命令以运行 Eleventy：

```bash
# 搜索当前目录，输出到 ./_site
npx @11ty/eleventy
```

{% callout "warn" %}请确保您始终使用 <code>npx @11ty/eleventy</code>（包括 <code>@11ty/</code> 前缀！）。如果您不包括 <code>@11ty/</code> 前缀，并且尚未安装 Eleventy（本地或全局），它将执行<strong><a href="https://www.npmjs.com/package/eleventy">错误包</a></strong>。为了一致性和准确性，请始终使用 <code>npx @11ty/eleventy</code>。{% endcallout %}

如果您使用的是 Eleventy 的全局安装，请从每个命令的开头删除 `npx @11ty/`，如下所示：

```bash
# 全局安装
eleventy
```

```bash
# `npx @11ty/eleventy` 等同于：
npx @11ty/eleventy --input=. --output=_site
```

阅读有关 [`--input`](/docs/config/#input-directory) 和 [`--output`](/docs/config/#output-directory) 的更多信息。请注意，通过 [config](/docs/config/) 文件设置输入和输出目录更加可靠，尤其是在使用 [`netlify dev`](https://docs.netlify.com/cli/get-started/#run-a-local-development-environment) 等工具时。

当前目录中的假设 `template.md` 将呈现为 `_site/template/index.html`。在 [永久链接](/docs/permalinks/) 中阅读更多信息。

```bash
# 仅使用一部分模板类型
npx @11ty/eleventy --formats=md,html,ejs
```

```bash
# 找出最新命令列表（还有更多）
npx @11ty/eleventy --help
```

### 当您保存时重新运行 Eleventy

```bash
# 启动 Browsersync Web 服务器以应用更改并自动刷新。我们还会为您 --watch。
npx @11ty/eleventy --serve
```

```bash
# 更改 Web 服务器的端口——使用 localhost:8081
npx @11ty/eleventy --serve --port=8081
```

{% callout "info" %}<strong>重要说明</strong>：<a href="https://browsersync.io/docs/#requirements">Browsersync 需要模板中出现 <code>&lt;body&gt;</code> 标记</a>，以便实时重新加载能正常工作。{% endcallout %}

```bash
# 当输入模板文件更改时自动运行。在您有自己的 Web 服务器时很有用。
npx @11ty/eleventy --watch
```

### 如果输出过多，使用 `--quiet`

```bash
# 嘘——不要在控制台中记录这么多内容
npx @11ty/eleventy --quiet
```

### `--dryrun`用于进行少量测试

在不写入文件系统的情况下运行。在 [调试](/docs/debugging/) 时十分有用。

```bash
# 运行 Eleventy 但不要写入任何文件
npx @11ty/eleventy --dryrun
```

### `--config` 用于更改配置文件名称

```bash
# 覆盖默认 eleventy 项目配置文件名称 (.eleventy.js)
npx @11ty/eleventy --config=myeleventyconfig.js
```

### `--to` 可以输出 JSON {% addedin "1.0.0" %}

```bash
# 输出一个 JSON 结构（不写入文件系统）
npx @11ty/eleventy --to=json

# 输出一个以换行符分隔的 JSON 结构（不写入文件系统）
npx @11ty/eleventy --to=ndjson

# 默认行为（输出到文件系统）
npx @11ty/eleventy --to=fs
```

阅读有关 [ndjson](https://github.com/ndjson/ndjson-spec) 的更多信息。

### `--incremental` 用于进行部分增量构建

```bash
# *重复* 构建仅对已更改的文件进行操作
npx @11ty/eleventy --watch --incremental
npx @11ty/eleventy --serve --incremental

# 使用 `--ignore-initial` 跳过最初的完整构建
npx @11ty/eleventy --serve --incremental --ignore-initial
```

阅读有关 [增量构建](/docs/usage/incremental/) 的更多信息。

### `--ignore-initial` 用于在不进行初始构建的情况下运行 Eleventy {% addedin "2.0.0-canary.25" %}

当 Eleventy 未运行时，请小心可能发生的文件更改！

```bash
# 当 Eleventy 启动时不要构建，仅在文件更改时构建
npx @11ty/eleventy --watch --ignore-initial
npx @11ty/eleventy --serve --ignore-initial
npx @11ty/eleventy --serve --incremental --ignore-initial
```

### 使用相同的输入和输出

是的，您可以使用相同的 `input` 和 `output` 目录，如下所示：

```bash
# 分析并将 Markdown 解析为 HTML，遵循目录结构。
npx @11ty/eleventy --input=. --output=. --formats=md
```

{% callout "warn" %}此处谨慎使用 <code>--formats=html</code>！如果您多次运行 eleventy，它也会尝试处理输出文件。在 <a href="/docs/languages/html/#using-the-same-input-and-output-directories">HTML 模板文档</a> 中阅读更多信息。{% endcallout %}

<!--
### 示例：处理单个文件

```bash
npx @11ty/eleventy --input=README.md --output=.
```

写入 `./README/index.html`。
-->