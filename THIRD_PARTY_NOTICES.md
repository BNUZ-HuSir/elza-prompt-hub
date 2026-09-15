# Third-Party Notices

## dynamicprompts

Elza Prompt Hub 的轻量随机 Prompt 解析器参考并核对了以下开源项目的 Variant 语法：

- Project: `dynamicprompts`
- Repository: <https://github.com/adieyal/dynamicprompts>
- Upstream version at review: `0.31.0`
- Fixed reference commit: `2475e312150d07b07a7d3dec2abab737414a9e36`
- License: MIT

本项目只独立实现以下兼容子集，不依赖、不打包也不复制 `dynamicprompts` 的 Python 源码：

- `{a|b|c}`
- `{0.5::a|1.5::b}`
- `{2$$a|b|c}`
- `{a|}`

### MIT License from the referenced upstream commit

The MIT License (MIT)

Copyright (c) 2023 Adi Eyal and others

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
