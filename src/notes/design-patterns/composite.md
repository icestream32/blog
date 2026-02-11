---
title: 组合模式
isOriginal: true
cover: https://images.icestream32.cn/images/2025/03/10/120941694_p0_master1200.jpg
order: 14
category:
    - 计算机
    - 读书笔记
    - 设计模式
tag:
    - 组合模式
    - TypeScript
    - Golang
---

组合模式（Composite Pattern），将对象组合成树形结构以表示“部分-整体”的层次结构。组合模式使得用户对单个对象和组合对象的使用具有一致性。

<!-- more -->

## 书中案例实现

场景：公司在不同地方设立了分公司，每个分公司的部门都是相似的。

### UML类图

@startuml
interface ICompany {
    +add(company: ICompany): void
    +remove(company: ICompany): void
    +display(depth: number): void
    +lineOfDuty(): void
}

class ConcreteCompany implements ICompany {
    +add(company: ICompany): void
    +remove(company: ICompany): void
    +display(depth: number): void
    +lineOfDuty(): void
}

class HRDepartment implements ICompany {
    +add(company: ICompany): void
    +remove(company: ICompany): void
    +display(depth: number): void
    +lineOfDuty(): void
}

class FinanceDepartment implements ICompany {
    +add(company: ICompany): void
    +remove(company: ICompany): void
    +display(depth: number): void
    +lineOfDuty(): void
}

ConcreteCompany o-- ICompany
@enduml

### 代码实现

::: tabs

@tab TypeScript

```ts
interface ICompany {
    add(company: ICompany): void;
    remove(company: ICompany): void;
    display(depth: number): void;
    lineOfDuty(): void;
}

class ConcreteCompany implements ICompany {
    private children: ICompany[] = [];
    private name: string;

    constructor(name: string) {
        this.name = name;
    }
    
    public add(company: ICompany): void {
        this.children.push(company);
    }

    public remove(company: ICompany): void {
        this.children.splice(this.children.indexOf(company), 1);
    }

    public display(depth: number): void {
        console.log(new Array(depth).join('-') + this.name);

        for (let i = 0; i < this.children.length; i++) {
            this.children[i].display(depth + 2);
        }
    }

    public lineOfDuty(): void {
        for (const child of this.children) {
            child.lineOfDuty();
        }
    }
}

class HRDepartment implements ICompany {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    // 因为是叶子节点，添加和删除没有意义
    public add(company: ICompany): void {}
    public remove(company: ICompany): void {}
    
    public display(depth: number): void {
        console.log(new Array(depth).join('-') + this.name);
    }

    public lineOfDuty(): void {
        console.log(`${this.name} 员工招聘培训管理`);
    }
}

class FinanceDepartment implements ICompany {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    public add(company: ICompany): void {}
    public remove(company: ICompany): void {}

    public display(depth: number): void {
        console.log(new Array(depth).join('-') + this.name);
    }

    public lineOfDuty(): void {
        console.log(`${this.name} 公司财务收支管理`);
    }
}

(async () => {
    const root = new ConcreteCompany('北京总公司');
    root.add(new HRDepartment('总公司人力资源部'));
    root.add(new FinanceDepartment('总公司财务部'));

    const comp = new ConcreteCompany('上海华东分公司');
    comp.add(new HRDepartment('华东分公司人力资源部'));
    comp.add(new FinanceDepartment('华东分公司财务部'));
    root.add(comp);

    const comp1 = new ConcreteCompany('南京办事处');
    comp1.add(new HRDepartment('南京办事处人力资源部'));
    comp1.add(new FinanceDepartment('南京办事处财务部'));
    comp.add(comp1);

    const comp2 = new ConcreteCompany('杭州办事处');
    comp2.add(new HRDepartment('杭州办事处人力资源部'));
    comp2.add(new FinanceDepartment('杭州办事处财务部'));
    comp.add(comp2);

    console.log('结构图：');
    root.display(1);

    console.log('\n职责：');
    root.lineOfDuty();
})()
```

输出如下：

```
结构图：
北京总公司
--总公司人力资源部
--总公司财务部
--上海华东分公司
----华东分公司人力资源部
----华东分公司财务部
----南京办事处
------南京办事处人力资源部
------南京办事处财务部
----杭州办事处
------杭州办事处人力资源部
------杭州办事处财务部

职责：
总公司人力资源部 员工招聘培训管理
总公司财务部 公司财务收支管理
华东分公司人力资源部 员工招聘培训管理
华东分公司财务部 公司财务收支管理
南京办事处人力资源部 员工招聘培训管理
南京办事处财务部 公司财务收支管理
杭州办事处人力资源部 员工招聘培训管理
杭州办事处财务部 公司财务收支管理
```

@tab Golang

```go
// composite.go
package composite

import (
	"fmt"
	"slices"
	"strings"
)

type ICompany interface {
	Add(company ICompany)
	Remove(company ICompany)
	Display(depth int)
	LineOfDuty()
}

type ConcreteCompany struct {
	name     string
	children []ICompany
}

func NewConcreteCompany(name string) *ConcreteCompany {
	return &ConcreteCompany{
		name:     name,
		children: []ICompany{},
	}
}

func (c *ConcreteCompany) Add(company ICompany) {
	c.children = append(c.children, company)
}

func (c *ConcreteCompany) Remove(company ICompany) {
	for i, child := range c.children {
		if child == company {
			c.children = slices.Delete(c.children, i, i+1)
			break
		}
	}
}

func (c *ConcreteCompany) Display(depth int) {
	fmt.Printf("%s%s\n", strings.Repeat("-", depth-1), c.name)
	for _, child := range c.children {
		child.Display(depth + 2)
	}
}

func (c *ConcreteCompany) LineOfDuty() {
	for _, child := range c.children {
		child.LineOfDuty()
	}
}

type HRDepartment struct {
	name string
}

func NewHRDepartment(name string) *HRDepartment {
	return &HRDepartment{
		name: name,
	}
}

// 叶子结点，Add、Remove 为空方法
func (h *HRDepartment) Add(company ICompany)    {}
func (h *HRDepartment) Remove(company ICompany) {}

func (h *HRDepartment) Display(depth int) {
	fmt.Printf("%s%s\n", strings.Repeat("-", depth), h.name)
}

func (h *HRDepartment) LineOfDuty() {
	fmt.Printf("%s 员工招聘培训管理\n", h.name)
}

type FinanceDepartment struct {
	name string
}

func NewFinanceDepartment(name string) *FinanceDepartment {
	return &FinanceDepartment{
		name: name,
	}
}

func (f *FinanceDepartment) Add(company ICompany)    {}
func (f *FinanceDepartment) Remove(company ICompany) {}

func (f *FinanceDepartment) Display(depth int) {
	fmt.Printf("%s%s\n", strings.Repeat("-", depth), f.name)
}

func (f *FinanceDepartment) LineOfDuty() {
	fmt.Printf("%s 公司财务收支管理\n", f.name)
}

// main.go
func main() {
	root := composite.NewConcreteCompany("北京总公司")
	root.Add(composite.NewConcreteCompany("华东分公司"))

	comp := composite.NewConcreteCompany("南京办事处")
	comp.Add(composite.NewFinanceDepartment("南京办事处财务部"))
	comp.Add(composite.NewHRDepartment("南京办事处人力资源部"))

	comp2 := composite.NewConcreteCompany("杭州办事处")
	comp2.Add(composite.NewFinanceDepartment("杭州办事处财务部"))
	comp2.Add(composite.NewHRDepartment("杭州办事处人力资源部"))

	root.Add(comp)
	root.Add(comp2)

	root.Display(1)
	root.LineOfDuty()
}
```

输出如下：

```
北京总公司
--华东分公司
--南京办事处
-----南京办事处财务部
-----南京办事处人力资源部
--杭州办事处
-----杭州办事处财务部
-----杭州办事处人力资源部
南京办事处财务部 公司财务收支管理
南京办事处人力资源部 员工招聘培训管理
杭州办事处财务部 公司财务收支管理
杭州办事处人力资源部 员工招聘培训管理
```

:::

## 思考

1. 组合模式的好处？

组合模式将对象组合成树形结构以表示“部分-整体”的层次结构。组合模式使得用户对基本对象和组合对象的使用具有一致性。

基本对象可以被组合成更复杂的组合对象，而这个组合对象又可以被组合，这样不断递归下去，客户代码中，任何用到基本对象的地方都可以使用组合对象了。

2. 组合模式的应用场景？

- 需求中体现部分与整体层次结构时，适合使用组合模式。
- 希望用户忽略组合对象与单个对象的不同，统一地使用组合结构中的所有对象时，适合使用组合模式。

3. 组合模式的实际应用举例？

- 文件系统

文件系统中，文件和文件夹是具有层次关系的，文件夹中可以包含文件和文件夹，文件夹和文件都具有相同的操作方法，比如删除、移动等。

- GUI界面组件（嵌套布局系统）

GUI界面组件中，按钮、文本框、窗口等都可以看作是组件，它们可以嵌套组合成复杂的界面。

- 游戏场景管理（复杂对象嵌套）

游戏场景中，场景可以包含多个子场景，子场景中可以包含多个子场景，这样不断嵌套下去，形成一个复杂的场景结构。

::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks/120941694) <br>
参考书籍：[《大话设计模式》](http://www.tup.tsinghua.edu.cn/booksCenter/book_09792501.html)

:::