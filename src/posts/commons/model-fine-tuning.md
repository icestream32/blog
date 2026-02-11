---
title: 模型微调初体验
isOriginal: true
order: 6
cover: https://images.icestream32.cn/images/2025/10/30/-136001506.jpeg
category:
    - 计算机
    - LLM
tag:
    - LLaMA Factory
    - Easy Dataset
    - MinerU
    - Qwen3-1.7B
    - DeepSeek-R1
---

本文主要介绍了模型微调的初体验，使用了LLM Factory、Easy Dataset、MinerU三个工具。

<!-- more -->

## 背景

为了使得新人快速上手售后商务系统的使用，需要一个基于说明文档的问答机器人，于是就想到了模型微调这一条路子。

以下是用到的一些工具：

- [LLaMA Factory](https://github.com/hiyouga/LLaMA-Factory/blob/main/README_zh.md)：使用零代码命令行与 Web UI 轻松微调百余种大模型
- [Easy Dataset](https://github.com/hiyouga/Easy-Dataset)：一个强大的大型语言模型微调数据集创建工具
- [MinerU](https://mineru.net/)：全能的文档解析神器
- [Qwen3-1.7B](https://huggingface.co/Qwen/Qwen3-1.7B)：一个强大的开源语言模型，用于模型微调
- [DeepSeek-R1](https://www.deepseek.com/)：一个强大的开源语言模型，用于生成Q&A对

## 实现流程

### 准备数据集

- 使用MinerU对说明文档进行解析，生成markdown格式数据

- 使用Easy Dataset对markdown格式进行分割，对于每一个文本分割块，进行数据清洗+问题生成，以下是一些示例：

![数据清洗+问题生成示例](https://images.icestream32.cn/images/2025/10/17/Snipaste_2025-10-17_10-16-17.jpg)

- 初步筛选问题，将一些没有价值的问题清除，一些问题示例如下：

```markdown
- 如何筛选打猎相机相关的RMA单？
- SKU下拉选项中，套件型号为空时，应该取什么信息？多个信息如何显示？
- 仓库SKU和NS SKU分别对应哪种库存使用场景？
- ...
```

- 生成问题对应的解答，并根据问题解答选择是否保留（由于是初体验，这里不做具体内容判断），以下是一些示例：

```markdown
- 问：如何筛选打猎相机相关的RMA单？
- 答：筛选打猎相机相关的RMA单时，可以通过平台店铺筛选功能进行区分。打猎相机的RMA单与Reolink的RMA单在同一系统中，但通过筛选平台店铺可以准确识别出打猎相机相关的售后单。
```

- 将问题和解答导出为json格式，并按照Alpaca格式排列，示例如下：

```json
[
    {
        "instruction": "如何筛选打猎相机相关的RMA单？",
        "input": "",
        "output": "筛选打猎相机相关的RMA单时，可以通过平台店铺筛选功能进行区分。打猎相机的RMA单与Reolink的RMA单在同一系统中，但通过筛选平台店铺可以准确识别出打猎相机相关的售后单。",
        "system": "你是一个RMA系统问答机器人，请根据用户输入以及自身拥有的RMA系统相关信息帮助用户解答问题"
    }
]
```

### 微调模型

- 新建一个文件夹，新建 conda 环境，并 clone LLaMA Factory 仓库代码
```bash
conda create -n llama_factory python=3.12
conda activate llama_factory

git clone https://github.com/hiyouga/LLaMA-Factory.git
```

- 安装相关依赖，验证并启动
```bash
pip install -e ".[torch,metrics]"

llamafactory-cli version

llamafactory-cli web-ui
```

- 将准备好的数据集放到代码仓库的data文件夹中，并修改`dataset_info.json`文件，添加以下内容：

```json
"datasets-OGVMC6ktwIEe-alpaca-2025-09-20": {
    "file_name": "datasets-OGVMC6ktwIEe-alpaca-2025-09-20.json",
    "formatting": "alpaca",
    "columns": {
        "prompt": "instruction",
        "query": "input",
        "system": "system",
        "response": "output"
    }
}
```

- 回到页面，展示如下：

![训练页面展示](https://images.icestream32.cn/images/2025/10/17/llama-factory.jpg)

::: tip
这里有几个参数需要关注：

- 模型名称：训练用到的模型，这里我选择Qwen3-1.7B-Base

- 下载源：开始训练时如果本地没有模型会自动下载模型，这里我选择huggingface

- 微调方法：综合考虑显卡性能与模型大小的因素，这里我选择full，full表示全量微调

- 数据集：选择之前准备好的数据集

- 学习率
    - 学习率是指模型在训练过程中学习新知识的速度，学习率越大，模型在训练过程中学习新知识的速度越快，但是也容易过拟合
    - 全参训练的一般学习率是1e-5，低学习率更适合全参训练，但是消耗的时间越长

- 训练轮数：
    - 训练轮数是指模型在训练过程中需要训练多少次，训练轮数越多，模型在训练过程中需要训练的时间越长
    - 训练轮数一般设置为3-5轮，过多会发生过拟合，过少会欠拟合

- 批处理大小：
    - 批处理大小是指模型在训练过程中每次训练的样本数量
    - 这里我选择4，刚好占满GPU显存

其他参数初体验可以保持模型，万事俱备，点击开始训练模型

:::

- 观察训练过程

控制台开始打印日志：

```bash
[INFO|2025-10-17 11:09:13] llamafactory.model.model_utils.kv_cache:143 >> KV cache is disabled during training.
[INFO|2025-10-17 11:09:15] llamafactory.model.model_utils.checkpointing:143 >> Gradient checkpointing enabled.
[INFO|2025-10-17 11:09:15] llamafactory.model.model_utils.attention:143 >> Using torch SDPA for faster training and inference.
[INFO|2025-10-17 11:09:15] llamafactory.model.adapter:143 >> Upcasting trainable params to float32.
[INFO|2025-10-17 11:09:15] llamafactory.model.adapter:143 >> Fine-tuning method: Full
[INFO|2025-10-17 11:09:15] llamafactory.model.loader:143 >> trainable params: 1,720,574,976 || all params: 1,720,574,976 || trainable%: 100.0000
```

模型参数说明：

- `trainable params`
  - 可训练参数数量
  - 表示训练过程中会被更新的参数数量

- `all params`
  - 模型总参数数量
  - 模型的所有参数总数

- `trainable%`
  - 可训练参数占比
  - 可训练参数占总参数的百分比
  - 100% 表示全参数微调（Full Fine-tuning），所有参数都会被训练
  - 如果使用 LoRA 等参数高效微调方法，这个值会很小（如 0.1%-1%）

trainable% 的大小取决于微调方法的选择：
- Full（全参数微调）：trainable% = 100%，训练效果最好但需要大量显存
- LoRA/QLoRA：trainable% 通常 < 1%，显存占用小但训练效果略逊
- 如果选择全参数微调但 trainable% 很小（如 0.1%），说明模型太大超出显存限制，系统自动降级为参数高效微调，训练时间会非常长

每隔一段时间会打印一次日志，展示如下：

```bash
[INFO|2025-10-17 11:15:23] llamafactory.train.callbacks:143 >> {'loss': 3.2374, 'learning_rate': 9.8746e-06, 'epoch': 0.37, 'throughput': 82.25}
{'loss': 3.2374, 'grad_norm': 12.05206298828125, 'learning_rate': 9.874639560909118e-06, 'epoch': 0.37, 'num_input_tokens_seen': 30240, 'train_runtime': 367.6627, 'train_tokens_per_second': 82.249}
[INFO|2025-10-17 11:22:08] llamafactory.train.callbacks:143 >> {'loss': 2.2260, 'learning_rate': 9.3761e-06, 'epoch': 0.75, 'throughput': 80.66
{'loss': 2.226, 'grad_norm': 5.411265850067139, 'learning_rate': 9.376117109543769e-06, 'epoch': 0.75, 'num_input_tokens_seen': 62304, 'train_runtime': 772.4616, 'train_tokens_per_second': 80.656}
```

训练日志说明：

- `loss` - 损失值
  - 衡量模型预测结果与真实结果之间的差距
  - 数值越小表示模型性能越好，训练目标就是让这个值不断降低

- `grad_norm` - 梯度范数
  - 表示梯度的大小/强度，用于监控训练稳定性
  - 如果数值过大可能导致梯度爆炸，过小可能导致梯度消失

- `learning_rate` - 当前学习率
  - 控制模型参数更新的步长
  - 这个值会随着训练过程动态调整（学习率衰减）

- `epoch` - 训练轮数进度
  - 表示当前训练进度，一个 epoch 代表模型看过一遍全部训练数据
  - 0.37 表示已完成 37% 的第一轮训练

- `train_tokens_per_second` / `throughput` - 训练吞吐量
  - 每秒处理的 token 数量，衡量训练速度的指标
  - 约 80-82 tokens/s 表示 GPU 利用率良好

观察webui的训练图表也可以了解训练进度，如下：

![训练图表](https://images.icestream32.cn/images/2025/10/17/Snipaste_2025-10-17_12-03-03.jpg)

风扇已经开始疯狂转动，显存已经被占满

![任务管理器性能视图](https://images.icestream32.cn/images/2025/10/17/Snipaste_2025-10-17_11-12-22.jpg)

## 模型测试

模型训练结束之后，会将检查点保存，选择webui上的检查点，然后加载模型，就可以进行模型测试了。

![模型测试](https://images.icestream32.cn/images/2025/10/17/Snipaste_2025-10-17_12-30-22.jpg)

可以看到模型已经成功加载，不过实际测下来回答的结果都挺抽象的，后续还需要进一步优化

之后可以导出，并使用`llama.cpp`转化为GGUF格式，部署到Ollama中

## 总结与展望

从零开始走完整个微调流程，让我对模型训练有了更直观的认识，也踩了不少坑。以下是我的一些发现和思考：

### 问题一：数据集来源过于单一

现状描述：

目前的数据集完全基于说明文档构建，这带来了一个明显的局限性——当用户拿着系统报错截图来提问时，模型基本"两眼一抹黑"，完全无法理解问题场景。

后续优化方向：

需要从多个维度扩充数据集来源：

- 技术文档层面：接入系统的规格文档、接口文档，甚至直接解析代码仓库（让模型真正理解系统底层逻辑）
- 实战经验层面：整理系统沟通群的历史聊天记录，用于构建多轮对话数据集（这些真实问答场景往往比文档更接地气）

### 问题二：数据集处理方式过于粗糙

现状描述：

目前采用的是"简单粗暴"的文本分割策略——按固定文本量机械切分，完全没有考虑上下文语义的连贯性。这就像把一本书撕成碎片，每片内容可能都不完整，导致生成的Q&A对质量参差不齐。

后续优化方向：

这一块其实是整个流程中最耗时但也最关键的环节，需要：

- 人工介入打标：对文本进行语义完整性划分，确保每个训练样本都是完整的知识单元
- 提示词工程优化：针对不同类型的文档内容，设计更精准的提示词模板，让高维模型生成的问答对更贴近实际应用场景
- 质量筛选机制：建立更严格的问答对评估标准，而不是当前的"能生成就行"

### 问题三：模型选择与训练策略需要平衡

现状描述：

在模型选择和微调方法上经历了"血泪三部曲"（此处请允许我吐槽一下）：

- 第一轮：尝试14b模型的LoRA微调，显存直接爆表，显卡驱动被干崩溃，电脑直接罢工需要重启。教训：理想很丰满，显卡很骨感。

- 第二轮：改用1.7b模型全参微调，结果训练轮次设置过多，模型严重过拟合，变成了"复读机"——不管问什么都在背诵数据集原文。教训：训练也要适可而止。

- 第三轮：也就是文中展示的这次训练，参数配置比较合理，训练过程稳定。但由于模型参数量较小（1.7b），回答上也不是那么准确。

另外，每次训练耗时都在一小时以上，多次试错下来时间成本大。

后续优化方向：

- 采用更大规模的模型（如7b-14b），配合LoRA等参数高效微调方法，既能降低显存压力，又能保留模型的通用知识能力，避免被垂直数据集"带偏"
- 优化硬件配置：在数据集准备完善后，换一个更高级的显卡，以支持更大规模模型的训练需求

::: info

封面来源：[Pixiv](https://pixiv.net/artworks/136001506)

:::