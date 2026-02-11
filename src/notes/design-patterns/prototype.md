---
title: 原型模式
isOriginal: true
order: 7
cover: https://images.icestream32.cn/images/2024/12/23/125160058_p0_master1200.jpg
category:
    - 计算机
    - 读书笔记
    - 设计模式
tag:
    - 原型模式
    - TypeScript
    - Golang
---

呼~ 业务最繁忙的一段时间已经过去了，现在终于有时间来写一些东西了，这次学习原型模式。

原型模式（Prototype Pattern）是一种创建型设计模式，它允许一个对象在创建另一个可定制的对象时，不需要知道任何创建的细节，只需要知道这个对象的类型即可。

<!-- more -->

## 书中案例实现

场景：多份简历，只有个别信息不同。

### UML 类图

@startuml
interface ICloneable {
+clone(): Object
}

class Resume {
+setPersonal(): void
+setWorkExperience(): void
+display(): void
}

class WorkExperience {
-workDate: string
-company: string
}

ICloneable <|.. Resume
ICloneable <|.. WorkExperience

Resume *- WorkExperience
@enduml

### 代码实现

::: tabs

@tab TypeScript

```ts
interface ICloneable {
	clone(): unknown;
}

class WorkExperience implements ICloneable {
	private _workDate: string = '';
	private _company: string = '';

	get workDate(): string {
		return this._workDate;
	}

	set workDate(value: string) {
		this._workDate = value;
	}

	get company(): string {
		return this._company;
	}

	set company(value: string) {
		this._company = value;
	}

	public clone(): WorkExperience {
		return Object.create(this);
	}
}

class Resume implements ICloneable {
	private _name: string = '';
	private _age: number = 0;
	private _workExperience: WorkExperience;

	constructor() {
		this._workExperience = new WorkExperience();
	}

	public setPersonal(name: string, age: number): void {
		this._name = name;
		this._age = age;
	}

	public setWorkExperience(workDate: string, company: string): void {
		this._workExperience.workDate = workDate;
		this._workExperience.company = company;
	}

	public display(): void {
		console.log(
			`${this._name} ${this._age} \n ${this._workExperience.workDate} ${this._workExperience.company}`
		);
	}

	public clone(): Resume {
		const obj = new Resume();
		obj._name = this._name;
		obj._age = this._age;
		obj._workExperience = this._workExperience.clone();
		return obj;
	}
}

(async () => {
	const a = new Resume();
	a.setPersonal('Tom', 34);
	a.setWorkExperience('2021', 'a');
	a.display();

	const b = a.clone();
	b.setPersonal('Jerry', 21);
	b.setWorkExperience('2022', 'b');
	b.display();

	a.display();
})();
```

::: tip

`Object.create()` 方法创建的对象是浅拷贝，如果对象中有引用类型的属性，那么拷贝的对象中的引用类型属性还是指向原对象的引用类型属性。

@tab Golang

```go
// prototype.go
package prototype

import "fmt"

type ICloneable interface {
	Clone() ICloneable
}

type WorkExperience struct {
	timeArea string
	company  string
}

func (w *WorkExperience) Clone() ICloneable {
	return &WorkExperience{timeArea: w.timeArea, company: w.company}
}

func (w *WorkExperience) SetWorkExperience(timeArea, company string) {
	w.timeArea = timeArea
	w.company = company
}

type Resume struct {
	name string
	age  int
	work *WorkExperience
}

func NewResume() *Resume {
	return &Resume{work: &WorkExperience{}}
}

func (r *Resume) SetPersonal(name string, age int) {
	r.name = name
	r.age = age
}

func (r *Resume) SetWorkExperience(timeArea, company string) {
	r.work.SetWorkExperience(timeArea, company)
}

func (r *Resume) Display() {
	fmt.Printf("Name: %s, Age: %d, WorkExperience: %s, %s\n", r.name, r.age, r.work.timeArea, r.work.company)
}

func (r *Resume) Clone() ICloneable {
	return &Resume{name: r.name, age: r.age, work: r.work.Clone().(*WorkExperience)}
}

// main.go
package main

import (
	prototype "design-patterns/07-prototype"
)

func main() {
	a := prototype.NewResume()
	a.SetPersonal("Tom", 25)
	a.SetWorkExperience("2010-2015", "Google")
	a.Display()

	b := a.Clone().(*prototype.Resume)
	b.SetPersonal("Jerry", 30)
	b.SetWorkExperience("2015-2020", "Facebook")
	b.Display()

	c := a.Clone().(*prototype.Resume)
	c.SetPersonal("Alice", 35)
	c.SetWorkExperience("2020-2025", "Amazon")
	c.Display()
}
```

::: tip

Golang 中没有类似于 Java 中的基类`Object`，所以在 Golang 中使用接口来实现原型模式，因此`Clone()`方法返回的是`ICloneable`接口类型，并且在具体实现中需要进行类型断言。

类型断言的方式为`r.work.Clone().(*WorkExperience)`，这里的`r.work.Clone()`返回的是`ICloneable`接口类型，需要通过`.(*WorkExperience)`进行类型断言。

注意：正常情况下一般是不会出现类型断言失败的情况，但是在实际开发中，为了保险起见，可以使用`if`语句进行判断，如：

```go
if work, ok := r.work.Clone().(*WorkExperience); ok {
    return &Resume{name: r.name, age: r.age, work: work}
}
```

:::

## 思考

1. 原型模式的优点有哪些？

就书中案例而言，原型模式的优点主要体现在创建对象时，只需要知道对象的类型即可，不需要知道对象的创建细节，这样可以减少对象创建的复杂度，直接表现为不需要`new`多次对象。

2. 原型模式的应用？

原型模式的应用场景主要是在创建对象的过程中，如果对象的创建过程比较复杂，或者对象的创建过程需要依赖其他对象，那么可以使用原型模式来创建对象。

3. 引用拷贝、浅拷贝、深拷贝的区别？

-   引用拷贝：拷贝的对象和原对象指向同一个内存地址，修改拷贝对象的属性会影响原对象的属性。

-   浅拷贝：拷贝的对象和原对象的基本数据类型属性是独立的，但是引用类型属性还是指向原对象的引用类型属性。

-   深拷贝：拷贝的对象和原对象的所有属性都是独立的，修改拷贝对象的属性不会影响原对象的属性。

详情请看[JavaGuide](https://javaguide.cn/java/basis/java-basic-questions-02.html#%E6%B7%B1%E6%8B%B7%E8%B4%9D%E5%92%8C%E6%B5%85%E6%8B%B7%E8%B4%9D%E5%8C%BA%E5%88%AB%E4%BA%86%E8%A7%A3%E5%90%97-%E4%BB%80%E4%B9%88%E6%98%AF%E5%BC%95%E7%94%A8%E6%8B%B7%E8%B4%9D)，里面对引用拷贝、浅拷贝、深拷贝进行了详细的解释。

4. 原型模式的实现？

以上代码案例只是手动实现了原型模式，实际开发中可以直接使用第三方库进行实现。

对于`TypeScript`，可以使用`lodash`库中的`cloneDeep`方法来实现深拷贝。

对于`Golang`，可以使用`github.com/jinzhu/copier`库来实现深拷贝。

以下是一些示例：

### TypeScript

1. 安装`lodash`库

```bash
npm i --save lodash # 安装lodash库
npm i -D @types/lodash # 安装lodash的类型声明文件
```

2. 使用`lodash`库

```ts
import _ from 'lodash';

const obj1 = { a: 1, b: { c: 2 } };

const cloneObj1 = _.cloneDeep(obj1); // 深拷贝
const obj2 = { ...obj1 }; // 浅拷贝

obj1.b.c = 3;
console.log(cloneObj1); // { a: 1, b: { c: 2 } }
console.log(cloneObj1); // { a: 1, b: { c: 2 } }
console.log(obj2); // { a: 1, b: { c: 3 } }

console.log(obj1 === cloneObj1); // false
console.log(obj2.b === obj1.b); // true
```

### Golang

1. 安装`github.com/jinzhu/copier`库

```bash
go get github.com/jinzhu/copier
```

2. 使用`github.com/jinzhu/copier`库

```go
package main

import (
	"fmt"

	"github.com/jinzhu/copier"
)

type WorkExperience struct {
	TimeArea string
	Company  string
}

type Resume struct {
	Name string
	Age  int
	Work *WorkExperience
}

func main() {
	a := &Resume{Name: "Tom", Age: 25, Work: &WorkExperience{TimeArea: "2010-2015", Company: "Google"}}
	b := &Resume{}
	c := &Resume{}
	b = a                                                      // 浅拷贝
	copier.CopyWithOption(c, a, copier.Option{DeepCopy: true}) // 深拷贝

	a.Work.Company = "Microsoft"

	fmt.Printf("a: %+v\n", a) // a: &{Name:Tom Age:25 Work:0xc00019e020}
	fmt.Printf("b: %+v\n", b) // b: &{Name:Tom Age:25 Work:0xc00019e020}
	fmt.Printf("c: %+v\n", c) // c: &{Name:Tom Age:25 Work:0xc00019e0a0}

	fmt.Println(a.Work == b.Work) // true
	fmt.Println(a.Work == c.Work) // false
}
```

::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks/125160058) <br>
参考书籍：[《大话设计模式》](http://www.tup.tsinghua.edu.cn/booksCenter/book_09792501.html)

:::
