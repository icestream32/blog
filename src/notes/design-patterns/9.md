---
title: 外观模式
isOriginal: true
order: 9
cover: https://images.icestream32.cn/images/2024/11/09/1731087479866.jpg
category:
    - 计算机
    - 读书笔记
    - 设计模式
tag:
    - 外观模式
    - TypeScript
    - Golang
---

外观模式（Facade Pattern）是一种结构设计模式，它为子系统中的一组接口提供一个统一的高层接口，使得子系统更容易使用。

<!-- more -->

## 书中案例实现

情景：买股票

### UML 类图

@startuml
class Stock1 {
    +buy(): void
    +sell(): void
}

class Stock2 {
    +buy(): void
    +sell(): void
}

class Stock3 {
    +buy(): void
    +sell(): void
}

class Fund {
    -stock1: Stock1
    -stock2: Stock2
    -stock3: Stock3
    +buyFund(): void
    +sellFund(): void
}

Stock1 <|-- Fund
Stock2 <|-- Fund
Stock3 <|-- Fund
@enduml

### 应用场景

1. 在设计初期阶段，应该有意识的将不同的两个层分离，比如经典的三层架构，可以在层与层之间建立外观 Facade。

2. 在开发阶段，子系统往往因为不断重构演化而变得越来越复杂，增加外观 Facade 可以提供一个简单的接口，减少它们之间的依赖。

3. 在维护一个遗留的大型系统时，可能这个系统已经非常难以维护和扩展，但新的需求开发又必须依赖于它，那么可以为新系统开发一个外观 Facade 类，来提供遗留系统的比较清晰简单的接口，让新系统与 Facade 类交互，提高复用性。

::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks) <br>
参考书籍：[《大话设计模式》](http://www.tup.tsinghua.edu.cn/booksCenter/book_09792501.html)

:::
