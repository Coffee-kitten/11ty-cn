---
eleventyNavigation:
  parent: Getting Started
  key: Programmatic API
  order: 6
---

# Programmatic API {% addedin "1.0.0" %}<!-- Beta 10 or Canary 50 -->

{% tableofcontents %}

在 Eleventy 1.0 中，您可以在自己的 Node 脚本中运行 Eleventy。 _(在幕后，[Eleventy Serverless](/docs/plugins/serverless/) 插件就是这样工作的)_

## 示例

### 写入文件系统

请不要忘记 [首先在本地项目中安装 Eleventy](/docs/#step-2-install-eleventy)！

现在创建一个名为 `my-node-script.js` 的文件，其内容如下：

{% codetitle "my-node-script.js" %}

```js
const Eleventy = require("@11ty/eleventy");

(async function () {
	let elev = new Eleventy();
	await elev.write();
})();
```

然后从命令行运行您的新脚本。 _当您运行此命令时，请不要包含 `~ $`。_

{% codewithprompt "cmdhomedir" %}
node my-node-script.js
{% endcodewithprompt %}

### 不要写入文件系统

使用 `.write()` 会将您的输出写入文件系统。如果您希望在不写入的情况下以编程方式检索内容，请使用 `.toJSON()` 或 `.toNDJSON()`.

#### JSON 输出

```js
const Eleventy = require("@11ty/eleventy");

(async function () {
	let elev = new Eleventy();
	let json = await elev.toJSON();
	// 所有结果
	console.log(json);
})();
```

#### ndjson 输出

```js
const Eleventy = require("@11ty/eleventy");

(async function () {
	let elev = new Eleventy();
	let stream = await elev.toNDJSON();
	stream.on("data", (entry) => {
		// 一次流一个输出结果
		let json = JSON.parse(entry.toString());
		console.log(json);
	});
})();
```

### 更改输入和输出目录

第一个参数是输入目录。第二个参数是输出目录。

```js
const Eleventy = require("@11ty/eleventy");

(async function () {
	let elev = new Eleventy(".", "_site");

	// 使用 `write` 或 `toJSON` 或 `toNDJSON`
})();
```

## 完整选项列表

Eleventy 的第三个参数是一个选项对象。

 _(文档部分正在进行中，但 [欢迎深入了解 `Eleventy` 类源代码，了解更多信息](https://github.com/11ty/eleventy/blob/{% latestVersion versions, config %}/src/Eleventy.js))_

```js
const Eleventy = require("@11ty/eleventy");

(async function () {
	let elev = new Eleventy(".", "_site", {
		// --quiet
		quietMode: true,

		// --config
		configPath: ".eleventy.js",

		config: function (eleventyConfig) {
			// 有一些自定义配置 API 操作
			// 与 eleventyConfig.addGlobalData 配合良好
		},
	});

	// 使用 `write` 或 `toJSON` 或 `toNDJSON`
})();
```

<!--
    // 仅当上面的第一个参数是单个文件（或 glob）时才有用
    inputDir: ".",
-->