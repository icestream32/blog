---
title: 建造者模式
isOriginal: true
order: 10
cover: https://images.icestream32.cn/images/2025/01/07/125828651_p0_master1200.jpg
category:
    - 计算机
    - 读书笔记
    - 设计模式
tag:
    - 建造者模式
    - TypeScript
    - Golang
---

建造者模式（Builder Pattern）是一种创建型设计模式，它可以将一个复杂对象的构建与其表示分离，使得同样的构建过程可以创建不同的表示。

<!-- more -->

## 书中案例实现

情景：组装产品

### UML 类图

@startuml
class Product {
    -parts: string[]
    +add(part: string): void
    +show(): void
}

class Builder {
    +buildPartA(): void
    +buildPartB(): void
    +getResult(): Product
}

class Director {
    -builder: Builder
    +construct(): void
}

class ConcreteBuilder1 {
    -product: Product
    +buildPartA(): void
    +buildPartB(): void
    +getResult(): Product
}

class ConcreteBuilder2 {
    -product: Product
    +buildPartA(): void
    +buildPartB(): void
    +getResult(): Product
}

ConcreteBuilder1 ..> Product
ConcreteBuilder2 ..> Product
Builder <|-- ConcreteBuilder1
Builder <|-- ConcreteBuilder2
Builder --o Director
@enduml

### 代码实现

::: tabs

@tab TypeScript

```ts
class Product {
    private _parts: string[] = [];

    // 添加产品部件
    public add(part: string) {
        this._parts.push(part);
    }

    // 列举所有的产品部件
    public show() {
        console.log(this._parts.join(', '));
    }
}

abstract class Builder {
    public abstract buildPartA(): void;
    public abstract buildPartB(): void;
    public abstract getResult(): Product;
}

// 建造具体的两个部件是部件A和部件B
class ConcreteBuilder1 extends Builder {
    private _product: Product = new Product();

    public buildPartA() {
        this._product.add('Part A');
    }

    public buildPartB() {
        this._product.add('Part B');
    }

    public getResult() {
        return this._product;
    }
}

// 建造具体的两个部件是部件X和部件Y
class ConcreteBuilder2 extends Builder {
    private _product: Product = new Product();

    public buildPartA() {
        this._product.add('Part X');
    }

    public buildPartB() {
        this._product.add('Part Y');
    }

    public getResult() {
        return this._product;
    }
}

// 用来指挥建造过程
class Director {
    private _builder: Builder;

    public constructor(builder: Builder) {
        this._builder = builder;
    }

    // 指挥者用来建造产品
    public create() {
        this._builder.buildPartA();
        this._builder.buildPartB();
    }
}

(async () => {
    const builder1 = new ConcreteBuilder1();
    const director1 = new Director(builder1);
    director1.create();
    const product1 = builder1.getResult();
    product1.show(); // Part A, Part B

    const builder2 = new ConcreteBuilder2();
    const director2 = new Director(builder2);
    director2.create();
    const product2 = builder2.getResult();
    product2.show(); // Part X, Part Y
})()
```

@tab Golang

```go
// builder.go
package builder

import "fmt"

type Builder interface {
	BuilPartA()
	BuilPartB()
}

type Product struct {
	parts []string
}

func (p *Product) Add(part string) {
	p.parts = append(p.parts, part)
}

func (p *Product) Show() {
	for _, part := range p.parts {
		fmt.Println(part)
	}
}

type Director struct {
	builder Builder
}

func NewDirector(builder Builder) *Director {
	return &Director{
		builder: builder,
	}
}

func (d *Director) Construct() {
	d.builder.BuilPartA()
	d.builder.BuilPartB()
}

type ConcreteBuilder1 struct {
	product *Product
}

func NewConcreteBuilder1() *ConcreteBuilder1 {
	return &ConcreteBuilder1{
		product: &Product{},
	}
}

func (b *ConcreteBuilder1) BuilPartA() {
	b.product.Add("Part A")
}

func (b *ConcreteBuilder1) BuilPartB() {
	b.product.Add("Part B")
}

func (b *ConcreteBuilder1) GetResult() *Product {
	return b.product
}

type ConcreteBuilder2 struct {
	product *Product
}

func NewConcreteBuilder2() *ConcreteBuilder2 {
	return &ConcreteBuilder2{
		product: &Product{},
	}
}

func (b *ConcreteBuilder2) BuilPartA() {
	b.product.Add("Part X")
}

func (b *ConcreteBuilder2) BuilPartB() {
	b.product.Add("Part Y")
}

func (b *ConcreteBuilder2) GetResult() *Product {
	return b.product
}

// main.go
package main

import (
	builder "design-patterns/09-builder"
)

func main() {
	builder1 := builder.NewConcreteBuilder1()
	director := builder.NewDirector(builder1)
	director.Construct()
	product := builder1.GetResult()
	product.Show()

	builder2 := builder.NewConcreteBuilder2()
	director = builder.NewDirector(builder2)
	director.Construct()
	product = builder2.GetResult()
	product.Show()
}
```

:::

## 总结

建造者模式的核心思想是将一个复杩对象的构建与其表示分离，使得同样的构建过程可以创建不同的表示。在实际开发中，建造者模式可以用来构建复杂对象，例如：构建一个复杂的产品，构建一个复杂的对象，构建一个复杂的数据结构等。

应用场景：

- ORM的QueryBuilder
- Redis的Pipeline

::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks/125828651) <br>
参考书籍：[《大话设计模式》](http://www.tup.tsinghua.edu.cn/booksCenter/book_09792501.html)

:::