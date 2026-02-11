---
title: 代理模式
isOriginal: true
order: 5
cover: https://images.icestream32.cn/images/2024/11/09/1731087479894.jpg
category:
    - 计算机
    - 读书笔记
    - 设计模式
tag:
    - 代理模式
    - TypeScript
    - Golang
---

代理模式（Proxy Pattern）是一种结构型设计模式，它允许你提供一个代理来控制对其他对象的访问。

<!-- more -->

## 书中案例实现

场景：追求者通过代理给被追求者送礼物

### UML类图

@startuml
left to right direction
interface IGiveGift {
    +giveDolls(): void
    +giveFlowers(): void
    +giveChocolate(): void
}

class Pursuit {
    -mm: SchoolGirl
    +constructor(mm: SchoolGirl)
    +giveDolls(): void
    +giveFlowers(): void
    +giveChocolate(): void
}

class Proxy {
    -gg: Pursuit
    +constructor(mm: SchoolGirl)
    +giveDolls(): void
    +giveFlowers(): void
    +giveChocolate(): void
}
class SchoolGirl {
    -name: string;
    +constructor(name: string)
    +getName(): string
}

IGiveGift <|.. Pursuit
IGiveGift <|.. Proxy

Proxy ..> SchoolGirl
Proxy --> Pursuit
@enduml

### 代码实现

::: tabs

@tab TypeScript

```ts
interface IGiveGift {
    giveDolls(): void;
    giveFlowers(): void;
    giveChocolate(): void;
}

class SchoolGirl {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }
}

class Pursuit implements IGiveGift {
    private _mm: SchoolGirl;

    public constructor(mm: SchoolGirl) {
        this._mm = mm;
    }

    public giveChocolate(): void {
        console.log(`Pursuit give chocolate to ${this._mm.getName()}`);
    }

    public giveDolls(): void {
        console.log(`Pursuit give dolls to ${this._mm.getName()}`);
    }

    public giveFlowers(): void {
        console.log(`Pursuit give flowers to ${this._mm.getName()}`);
    }
}

class TestProxy implements IGiveGift {
    private gg: Pursuit;

    public constructor(mm: SchoolGirl) {
        this.gg = new Pursuit(mm);
    }

    public giveChocolate(): void {
        this.gg.giveChocolate();
    }

    public giveDolls(): void {
        this.gg.giveDolls();
    }

    public giveFlowers(): void {
        this.gg.giveFlowers();
    }
}

// 客户端代码
(async () => {
    const jiaojiao = new SchoolGirl('Jiaojiao');
    const proxy = new TestProxy(jiaojiao);

    proxy.giveChocolate();
    proxy.giveDolls();
    proxy.giveFlowers();
})()
```

@tab Golang

```go
// proxy.go
package proxy

import "fmt"

type IGiveGift interface {
	GiveDolls()
	GiveFlowers()
	GiveChocolate()
}

type SchoolGirl struct {
	name string
}

func NewSchoolGirl(name string) *SchoolGirl {
	return &SchoolGirl{name: name}
}

func (sg *SchoolGirl) GetName() string {
	return sg.name
}

type Pursuit struct {
	mm *SchoolGirl
}

func NewPursuit(mm *SchoolGirl) *Pursuit {
	return &Pursuit{mm: mm}
}

func (p *Pursuit) GiveChocolate() {
	fmt.Printf("Pursuit give chocolate to %s\n", p.mm.GetName())
}

func (p *Pursuit) GiveDolls() {
	fmt.Printf("Pursuit give dolls to %s\n", p.mm.GetName())
}

func (p *Pursuit) GiveFlowers() {
	fmt.Printf("Pursuit give flowers to %s\n", p.mm.GetName())
}

type Proxy struct {
	gg *Pursuit
}

func NewProxy(mm *SchoolGirl) *Proxy {
	return &Proxy{gg: NewPursuit(mm)}
}

func (tp *Proxy) GiveChocolate() {
	tp.gg.GiveChocolate()
}

func (tp *Proxy) GiveDolls() {
	tp.gg.GiveDolls()
}

func (tp *Proxy) GiveFlowers() {
	tp.gg.GiveFlowers()
}

// main.go
package main

import (
	proxy "design-patterns/05-proxy"
)

func main() {
	mm := proxy.NewSchoolGirl("JiaoJiao")
	daili := proxy.NewProxy(mm)
	daili.GiveDolls()
	daili.GiveFlowers()
	daili.GiveChocolate()
}
```

:::

::: tip

在`TypeScript`中，有一个全局包，叫`ts-node`，里面有对`Proxy`类的定义，所以在`TypeScript`中不能使用`Proxy`类名，所以这里使用了`TestProxy`。

:::

### 应用场景

- 远程代理：为一个对象在不同的地址空间提供局部代表，这样可以隐藏一个对象存在于不同地址空间的事实。
    - `RPC`调用
    - `WebService`调用

- 虚拟代理：根据需要创建开销很大的对象。通过代理模式在需要的时候才创建。
    - 图片加载
    - `Hibernate`中的`Lazy Load`

- 保护代理：控制对原始对象的访问。保护代理用于对象应该有不同的访问权限的时候。
    - `Spring Security`中的`AOP`
    - `Mybatis`中的`MapperProxy`

::: info

封面来源：[Pixiv](https://www.pixiv.net) <br>
参考书籍：[《大话设计模式》](http://www.tup.tsinghua.edu.cn/booksCenter/book_09792501.html)

:::