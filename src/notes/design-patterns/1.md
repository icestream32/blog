---
title: 面向对象基础
isOriginal: true
order: 1
cover: https://images.icestream32.cn/images/2024/11/17/124086849_p0_master1200.jpg
category:
    - 计算机
    - 读书笔记
    - 设计模式
tag:
    - 面向对象基础
    - TypeScript
    - Golang
---

书中的第0章对面向对象的基础进行了介绍，主要是对面向对象的概念进行了解释，以及面向对象的特点和优点。这里主要记录一些自己的理解以及代码实现。

<!-- more -->

## 类与实例

::: tabs

@tab TypeScript

TS 语言几乎和Java一样，都是基于类的面向对象语言，所以在TS中实现类的定义以及实例的创建与调用是非常简单的。

```typescript
class Cat {
    shout() {
        console.log('喵');
    }
}

const cat = new Cat();
cat.shout(); // 喵
```

@tab Golang

在Golang中实现类的定义以及实例的创建与调用是有些不同的。

Golang 通过结构体struct来类比于类，通过方法来实现类的方法。

```go
// base.go
package base

import (
	"fmt"
)

type Cat struct {
}

func (c Cat) Shout() {
	fmt.Println("喵")
}

// base_test.go
package base

import (
	"testing"
)

func TestCat_Shout(t *testing.T) {
	cat := Cat{}
	cat.Shout()
}
```

::: tip
可以看到这两个语言的在类与实例方面的不同之处：

- 类的创建

    - TypeScript通过class关键字来创建类
    - Golang通过struct关键字来创建结构体（类）
- 类中方法的创建

    - TypeScript通过方法名来定义方法
    - Golang通过方法名和方法接收者来定义方法
- 实例的创建

    - TypeScript通过new关键字来创建实例
    - Golang通过直接创建结构体实例来创建实例
- 测试

    - TypeScript通过外部import的方式来测试
    - Golang通过测试文件来测试

:::

## 构造方法

::: tabs

@tab TypeScript

TS中的构造方法通过constructor来定义，构造方法会在实例创建的时候自动调用。

```typescript
class Cat {
    constructor() {
        console.log('Cat is created');
    }

    shout() {
        console.log('喵');
    }
}

const cat = new Cat();
cat.shout(); // 喵
```

@tab Golang

Golang中的构造方法通过NewXXX的方式来定义，通过显式调用NewXXX方法来创建实例。

```go
// base.go
package base

import (
    "fmt"
)

type Cat struct {
}

func NewCat() *Cat {
    fmt.Println("Cat is created")
    return &Cat{}
}

func (c Cat) Shout() {
    fmt.Println("喵")
}

// base_test.go
package base

import (
    "testing"
)

func TestCat_Shout(t *testing.T) {
    cat := NewCat()
    cat.Shout() // 喵
}
```

:::

## 方法重载

::: tabs

@tab TypeScript

TypeScript（TS）支持方法重载（Function Overloading），通过定义多个方法签名，可以实现方法重载的效果。

然而，TypeScript的方法重载与传统面向对象语言（如Java、C#）不同，其实现方式稍有差异，并且运行时只会执行实现的方法。

```typescript
class Cat {

    shout(): void;
    shout(name: string): void;
    shout(name?: string): void { // 兼容以上两种参数，但还得判断name是否存在
        console.log('喵' + name);
    }
}

const cat = new Cat();
cat.shout(); // 喵undefined
cat.shout('喵'); // 喵喵
```

@tab Golang

Golang 不支持方法重载，设计者认为方法重载会增加代码的复杂度。

:::

## 属性与修饰符

::: tabs

@tab TypeScript

可以在方法前面添加get、set关键字，来实现属性的访问和修改。

```typescript
class Cat {
    private _name: string;

    get name(): string {
        return this._name;
    }

    set name(name: string) {
        this._name = name;
    }
}

const cat = new Cat();
cat.name = 'Tom';
console.log(cat.name); // Tom
```

@tab Golang

Golang可以通过定义Get、Set结构体方法来实现属性的访问和修改。

```go
// base.go
package base

type Cat struct {
    name string
}

func (c Cat) Name() string {
    return c.name
}

func (c *Cat) SetName(name string) {
    c.name = name
}

// base_test.go
package base

import (
    "testing"
    "fmt"
)

func TestCat_Name(t *testing.T) {
    cat := Cat{name: "Tom"}
    if cat.Name() != "Tom" {
        t.Error("Name error")
    }
    fmt.Println(cat.Name())
}
```

:::

## 封装

::: tabs

@tab TypeScript

TS中的封装通过private、protected、public来实现，private表示私有属性，protected表示受保护的属性，public表示公有属性。

```typescript
class Cat {
    private _name: string;

    public value: number;
}

const cat = new Cat();
cat.value = 1;
console.log(cat.value); // 1
cat._name = 'Tom'; // Error: Property '_name' is private and only accessible within class 'Cat'.
```

@tab Golang

Golang中的封装通过大小写来实现，大写表示公有属性，小写表示私有属性。

作用域是包级别的，而不是类级别的，因此在同一个包中，可以访问到私有属性。

```go
// base.go
package base

import (
	"fmt"
)

type Cat struct {
	Name  string // public
	value string // private
}

// base_test.go
package base

import (
	"fmt"
	"testing"
)

func TestCat_Shout(t *testing.T) {
	cat := NewCat()
	cat.Shout()
}

func TestCat_Name(t *testing.T) {
	cat := Cat{}
	cat.Name = "Tom"
	cat.value = "Jerry" // 这里仍然可以修改
	if cat.Name != "Tom" {
		t.Error("Name is not Tom")
	}
	fmt.Println(cat.Name)
}
```

:::

## 继承

::: tabs

@tab TypeScript

TS中的继承通过extends关键字来实现，通过super关键字来调用父类的构造方法。

```typescript
class Animal {
    protected name: string = '';
    public constructor(name?: string) {
        if (name) {
            this.name = name;
        }
    }

    protected _shoutNum: number = 3;
    public get shoutNum(): number {
        return this._shoutNum;
    }
    public set shoutNum(value: number) {
        this._shoutNum = value;
    }

    public shout(): string {
        return '';
    }
}

class Cat extends Animal {
    public constructor(name?: string) {
        super(name);
    }

    public shout(): string {
        let result = '';
        for (let i = 0; i < this.shoutNum; i++) {
            result += '喵';
        }
        return '我的名字叫' + this.name + ' ' + result;
    }
}

class Dog extends Animal {
    public constructor(name?: string) {
        super(name);
    }

    public shout(): string {
        let result = '';
        for (let i = 0; i < this.shoutNum; i++) {
            result += '汪';
        }
        return '我的名字叫' + this.name + ' ' + result;
    }
}

const cat = new Cat('Tom');
console.log(cat.shout()); // 我的名字叫Tom 喵喵喵
const dog = new Dog('Jerry');
console.log(dog.shout()); // 我的名字叫Jerry 汪汪汪
```

::: tip

这里有一点需要注意，Java和TS对于getter/setter的处理：

Java中的getter/setter是通过方法来实现的，而TS中的getter/setter是通过属性来实现的，因此在TS中属性和getter/setter的名称不能相同。

对于Java来说属性名和方法是两个不同的概念，而对于TS来说属性和getter/setter是一个概念。

@tab Golang

Golang的设计者认为继承会增加代码的复杂度，所以不支持继承，但是可以通过组合的方式来实现继承的效果。

```go
// base.go
package base

type Animal struct {
	name string
}

func NewAnimal(name string) *Animal {
	return &Animal{name: name}
}

func (a Animal) Shout() string {
	return ""
}

type Cat struct {
	Animal
	shoutNum int // 可以看到因为Animal中不需要shoutNum，但是这里需要，因此可以通过组合的方式来定义
}

func NewCat(name string) *Cat {
	return &Cat{Animal: *NewAnimal(name), shoutNum: 3}
}

func (c Cat) Shout() string {
	result := ""
	for i := 0; i < c.shoutNum; i++ {
		result += "喵"
	}
	return "我的名字叫" + c.name + " " + result
}

type Dog struct {
	Animal
	shoutNum int // 可以看到因为Animal中不需要shoutNum，但是这里需要，因此可以通过组合的方式来定义
}

func NewDog(name string) *Dog {
	return &Dog{Animal: *NewAnimal(name), shoutNum: 3}
}

func (d Dog) ShShout() string {
	result := ""
	for i := 0; i < d.shoutNum; i++ {
		result += "汪"
	}
	return "我的名字叫" + d.name + " " + result
}

// base_test.go
package base

import (
    "testing"
    "fmt"
)

func TestCat_Shout(t *testing.T) {
    cat := NewCat("Tom")
    fmt.Println(cat.Shout()) // 我的名字叫Tom 喵喵喵
    dog := NewDog("Jerry")
    fmt.Println(dog.ShShout()) // 我的名字叫Jerry 汪汪汪
}
```

:::

::: tip

TypeScript可以给属性添加默认值，但是Golang不支持给属性添加默认值，因此需要在构造方法中初始化属性，或者显式调用一个自定的Init()方法来初始化属性。

:::

## 抽象类

::: tabs

@tab TypeScript

TS中的抽象类通过abstract关键字来定义，抽象类不能被实例化，只能被继承。

```typescript
abstract class Animal {
    protected name: string = '';
    public constructor(name?: string) {
        if (name) {
            this.name = name;
        }
    }

    protected _shoutNum: number = 3;
    public get shoutNum(): number {
        return this._shoutNum;
    }
    public set shoutNum(value: number) {
        this._shoutNum = value;
    }

    public abstract shout(): string;
}

const animal = new Animal(); // 报错：无法创建抽象类的实例
```

@tab Golang

Golang不支持抽象类，但是可以通过接口和小写字母开头的基类来实现抽象类的效果，仅对包外有限制效果，对包内没有限制效果，一般用来约束接口的实现。

也就是说，在Go里也可以创建抽象类，但是一般不这么做，因为没有意义。

```go
// base.go
package base

type Animal interface {
    Shout() string
}

type animal struct {
    name string
}

// main.go
package main

import (
    "fmt"
    "base"
)

func main() {
    animal := base.animal{} // 报错：cannot refer to unexported name base.animal
}
```

:::

## 多态

::: tabs

@tab TypeScript

TS中的多态通过接口定义方法，类实现接口方法来实现。

```typescript
interface Animal {
    shout(): void;
}

class Cat implements Animal {
    shout() {
        console.log('喵');
    }
}

class Dog implements Animal {
    shout() {
        console.log('汪');
    }
}

const cat = new Cat();
const dog = new Dog();
cat.shout(); // 喵
dog.shout(); // 汪
```

@tab Golang

Golang中的多态通过接口定义方法，结构体隐式实现接口方法来实现。

这个隐式实现和Java有很大不同，也就是说只要结构体实现了接口的方法，那么这个结构体就实现了这个接口。

```go
// base.go
package base

import (
    "fmt"
)

type Animal interface {
    Shout()
}

type Cat struct {
}

func (c Cat) Shout() {
    fmt.Println("喵")
}

type Dog struct {
}

func (d Dog) Shout() {
    fmt.Println("汪")
}

// base_test.go
package base

import (
    "testing"
)

func Test_Shout(t *testing.T) {
    cat := Cat{}
    dog := Dog{}
    cat.Shout()
    dog.Shout()
}
```

:::

## 集合

::: tabs

@tab TypeScript

TS中的集合通过数组来实现，数组中可以存放不同类型的元素。

```typescript
class Cat {
    shout() {
        console.log('喵');
    }
}

class Dog {
    shout() {
        console.log('汪');
    }
}

const animals = [new Cat(), new Dog()];
for (const animal of animals) {
    animal.shout();
}
```

@tab Golang

Golang中的集合通过切片来实现，切片中只能存放相同类型的元素。

```go
// base.go
package base

import (
	"fmt"
)

type Animal interface {
	Shout()
}

type Cat struct {
}

func (c Cat) Shout() {
	fmt.Println("喵")
}

type Dog struct {
}

func (d Dog) Shout() {
	fmt.Println("汪")
}

// base_test.go
package base

import (
    "testing"
)

func Test_Shout(t *testing.T) {
	animals := []Animal{Cat{}, Dog{}} // 因为 Cat 和 Dog 都实现了 Animal 接口，所以可以放在同一个数组中
	for _, animal := range animals {
		animal.Shout()
	}
}
```

:::

## 泛型

::: tabs

@tab TypeScript

TS中的泛型通过\<T\>来实现，可以在类、方法、接口中使用泛型。

```typescript
class Cat<T> {
    shout(value: T): void {
        console.log(value);
    }
}

const cat = new Cat<string>();
cat.shout('喵'); // 喵
const cat2 = new Cat<number>();
cat2.shout(123); // 123
```

@tab Golang

Golang在1.18版本中引入了泛型，通过[T]来实现，可以在接口、结构体、方法中使用泛型。

```go
// base.go
package base

import (
    "fmt"
)

type Cat[T any] struct {
}

func (c Cat[T]) Shout(value T) {
    fmt.Println(value)
}

// base_test.go
package base

import (
    "testing"
)

func Test_Shout(t *testing.T) {
	cat := Cat[string]{}
	cat.Shout("喵") // 喵
	cat2 := Cat[int]{}
	cat2.Shout(123) // 123
}
```
:::

在这里总结一下TS、Java、Go的泛型对比：

|特性 | TypeScript | Java |	Go |
|:---|:---|:---|:---|
| 静态检查 | <HopeIcon icon="fa-solid fa-check" color="#63e6be"/> 编译时强类型检查 | <HopeIcon icon="fa-solid fa-check" color="#63e6be"/>编译时检查 | <HopeIcon icon="fa-solid fa-check" color="#63e6be"/> 编译时检查 |
| 运行时类型信息 | <HopeIcon icon="fa-solid fa-xmark" color="red"/> 无运行时类型信息 | <HopeIcon icon="fa-solid fa-xmark" color="red"/> 类型擦除后无运行时类型信息 | <HopeIcon icon="fa-solid fa-check" color="#63e6be"/> 泛型保留运行时类型信息 |
| 运行时开销 | 无运行时开销 | 需要类型转换 | 无类型转换 |
| 代码生成方式 | 无生成，纯类型检查 | 单一实现（类型擦除） | 实例化生成具体实现 |
| 灵活性 | 极高（与 JS 特性结合） | 中等，依赖类型擦除 | 中等，通过接口约束支持灵活性 |
| 性能影响 | 不影响运行时性能 | 类型转换可能略微影响性能 | 性能优越，但可能增加二进制体积 |
| 二进制文件体积 | 不影响（只生成 JS 文件） | 不影响 | 二进制体积可能增大 |

## 总结

回顾了一下面向对象的知识以及TS和Go的具体实现，温故而知新~~~

::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks/124086849) <br>
参考书籍：[《大话设计模式》](http://www.tup.tsinghua.edu.cn/booksCenter/book_09792501.html)

:::