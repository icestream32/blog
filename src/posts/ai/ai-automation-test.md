---
title: AI 辅助 Playwright 自动化测试实战
isOriginal: true
order: 10
category:
    - 计算机
    - AI
tag:
    - Playwright
    - pytest
    - 自动化测试
    - AI 辅助
    - Cursor
    - POM
---

记录使用 AI 辅助搭建 Python Playwright 自动化测试框架的完整流程，包括环境配置、登录态管理、POM 设计模式和 Cursor 重构工作流。

<!-- more -->

## 一、为什么选择 AI 辅助测试

作为后端开发工程师，我对自动化测试并不陌生，但 UI 自动化一直是个痛点：元素定位不稳定、页面结构变化导致脚本失效、维护成本高。

这次尝试了一套新工作流：**用 Playwright 录制操作 → AI 重构成 POM 结构 → pytest 执行**。整个过程中，AI 负责代码生成和重构，我负责业务逻辑和验证，效率提升明显。

## 二、环境搭建

### 2.1 创建 Python 环境

我使用 conda 管理环境（当然也可以用 venv）：

```bash
conda create -n auto-test python=3.13 -y
conda activate auto-test
```

### 2.2 安装依赖

```bash
pip install playwright pytest pytest-html allure-pytest python-dotenv
python -m playwright install chromium
```

验证安装：

```bash
python -c "from playwright.sync_api import sync_playwright; p = sync_playwright().start(); b = p.chromium.launch(); print('✅ Chromium OK'); b.close(); p.stop()"
```

### 2.3 项目结构

```
ai-automation-python/
├── auth/                          # 登录态（不提交 git）
│   ├── admin_state.json
│   └── user_state.json
├── config/
│   └── settings.py                # URL、路径等配置
├── pages/                         # POM 页面对象
│   └── web/
│       ├── base_page.py           # 基类
│       └── {feature}_page.py      # 各页面类
├── tests/
│   └── web/
│       ├── record/                # 原始录制代码备份
│       └── test_{feature}.py      # 正式测试用例
├── utils/
│   └── save_auth.py               # 登录态保存工具
├── conftest.py                    # 全局 fixture
├── pytest.ini                     # pytest 配置
└── .env                           # 环境变量
```

## 三、登录态管理

### 3.1 保存登录态

测试需要登录态，但不想每次都手动登录。Playwright 的 `storage_state` 可以保存 Cookie 和 LocalStorage：

```python
# utils/save_auth.py
from playwright.sync_api import sync_playwright
from config.settings import WEB_URL, AUTH_ADMIN

def save_auth(save_path: str, role: str = "用户"):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        page.goto(WEB_URL)
        
        print("⏳ 请在浏览器中手动登录...")
        input()  # 等待手动登录
        
        context.storage_state(path=save_path)
        print(f"✅ 登录态已保存到：{save_path}")
        browser.close()
```

运行后手动登录，登录态会保存到 `auth/admin_state.json`。

### 3.2 加载登录态

```python
# conftest.py
import pytest
from playwright.sync_api import sync_playwright
from config.settings import WEB_URL, AUTH_ADMIN

@pytest.fixture(scope="session")
def admin_driver():
    pw = sync_playwright().start()
    browser = pw.chromium.launch(headless=False)
    context = browser.new_context(storage_state=AUTH_ADMIN)
    page = context.new_page()
    page.goto(WEB_URL)
    yield page
    context.close()
    browser.close()
    pw.stop()
```

这样所有测试用例都能复用登录态，无需重复登录。

## 四、录制与重构

### 4.1 录制操作

Playwright 自带录制器，可以边操作边生成代码：

```bash
python -m playwright codegen \
  --load-storage auth/admin_state.json \
  https://example.com
```

录制时会弹出浏览器和 Inspector 窗口，右侧实时显示生成的代码。

### 4.2 AI 重构为 POM

录制的代码可读性差，我让 Cursor 帮忙重构成 POM 结构。在 Cursor Chat 中输入：

```
参考 POM 设计模式，帮我重构以下录制代码：

[粘贴原始代码]
```

AI 会生成规范的页面对象类：

```python
# pages/web/login_page.py
class LoginPage:
    def __init__(self, page):
        self.page = page
        self.username_input = page.locator("#username")
        self.password_input = page.locator("#password")
        self.login_btn = page.get_by_role("button", name="登录")

    def login(self, username: str, password: str):
        self.username_input.fill(username)
        self.password_input.fill(password)
        self.login_btn.click()
```

测试用例变得简洁：

```python
# tests/web/test_login.py
def test_login(admin_driver):
    login = LoginPage(admin_driver)
    login.login("admin", "123456")
    assert "/home" in admin_driver.url
```

## 五、运行测试

```bash
# 运行单个测试文件
pytest tests/web/test_feature.py -v -s

# 运行所有 web 测试
pytest tests/web/ -v -s
```

参数说明：
- `-v`：显示每条用例的名称和结果
- `-s`：显示 print 输出，方便调试

## 六、完整工作流

```
conda activate auto-test
        ↓
python utils/save_auth.py        （登录态过期时）
        ↓
python -m playwright codegen     （录制业务操作）
        ↓
保存到 tests/web/record/*_raw.py  （备份原始代码）
        ↓
Cursor Chat：AI 重构 POM          （生成规范代码）
        ↓
pytest tests/web/test_*.py -v -s  （运行测试）
```

## 七、实践心得

**POM 设计模式确实有用**。页面元素变更时，只需修改 `pages/` 里的一个文件，所有测试用例自动生效，维护成本大幅降低。

**AI 辅助代码生成很高效**。录制代码通常很乱，手动重构费时费力，交给 AI 几秒钟就能生成规范结构，我只需要审查业务逻辑是否正确。

**登录态管理是关键**。用 `storage_state` 保存登录态比 CDP 接管更稳定，支持多账号切换，适合自动化测试场景。

## 总结

这套工作流让我这个后端工程师也能快速上手 UI 自动化测试。核心是**录制 + AI 重构**，避免了手写大量样板代码，把精力集中在业务逻辑验证上。

后续打算接入 Allure 报告和 GitHub Actions CI，实现测试报告可视化和自动触发。

::: info

参考资料：
- [Playwright 官方文档](https://playwright.dev)
- [pytest 文档](https://docs.pytest.org)
- [Cursor IDE](https://cursor.com)

:::
