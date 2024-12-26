---
title: 模板方法模式
isOriginal: true
order: 8
cover: https://images.icestream32.cn/images/2024/12/26/125536630_p0_master1200.jpg
category:
    - 计算机
    - 读书笔记
    - 设计模式
tag:
    - 模板方法模式
    - TypeScript
    - Golang
---

模版方法模式（Template Method Pattern）是一种行为设计模式，它定义了一个操作中的算法的骨架，而将一些步骤延迟到子类中。模版方法使得子类可以在不改变算法结构的情况下，重新定义算法中的某些步骤。

<!-- more -->

## 书中案例实现

场景：学生答题，试卷为同一份

### UML 类图

@startuml
abstract class TestPaper {
    +testQuestion1(): void
    +testQuestion2(): void
    +testQuestion3(): void
    +answer1(): string
    +answer2(): string
    +answer3(): string
}

class TestPaperA {
    +answer1(): string
    +answer2(): string
    +answer3(): string
}

class TestPaperB {
    +answer1(): string
    +answer2(): string
    +answer3(): string
}

TestPaper <|-- TestPaperA
TestPaper <|-- TestPaperB
@enduml

### 代码实现

::: tabs

@tab TypeScript

```ts
abstract class TestPaper {
    public testQuestion1(): void {
        console.log('Question 1');
        console.log(`Answer: ${this.answer1()}`);
    }

    public testQuestion2(): void {
        console.log('Question 2');
        console.log(`Answer: ${this.answer2()}`);
    }

    public testQuestion3(): void {
        console.log('Question 3');
        console.log(`Answer: ${this.answer3()}`);
    }

    public abstract answer1(): string;
    public abstract answer2(): string;
    public abstract answer3(): string;
}

class TestStudentA extends TestPaper {
    public answer1(): string {
        return 'A';
    }

    public answer2(): string {
        return 'B';
    }

    public answer3(): string {
        return 'C';
    }
}

class TestStudentB extends TestPaper {
    public answer1(): string {
        return 'C';
    }

    public answer2(): string {
        return 'B';
    }

    public answer3(): string {
        return 'A';
    }
}

(async () => {
    const studentA = new TestStudentA();
    studentA.testQuestion1();
    studentA.testQuestion2();
    studentA.testQuestion3();

    const studentB = new TestStudentB();
    studentB.testQuestion1();
    studentB.testQuestion2();
    studentB.testQuestion3();
})();
```

@tab Golang

```go
// template.go
package template

import "fmt"

// ITest 定义了测试的接口
type ITest interface {
	TestQuestion1()
	TestQuestion2()
	TestQuestion3()
	Answer1() string
	Answer2() string
	Answer3() string
}

type TestPaper struct {
	ITest
}

func NewTestPaper(test ITest) TestPaper {
	return TestPaper{ITest: test}
}

func (t *TestPaper) TestQuestion1() {
	fmt.Println("Question 1")
	fmt.Println(t.Answer1())
}

func (t *TestPaper) TestQuestion2() {
	fmt.Println("Question 2")
	fmt.Println(t.Answer2())
}

func (t *TestPaper) TestQuestion3() {
	fmt.Println("Question 3")
	fmt.Println(t.Answer3())
}

type TestStudentA struct {
	TestPaper
}

func NewTestStudentA() *TestStudentA {
	student := &TestStudentA{}
	student.TestPaper = NewTestPaper(student)
	return student
}

func (t *TestStudentA) Answer1() string {
	return "Answer 1"
}

func (t *TestStudentA) Answer2() string {
	return "Answer 2"
}

func (t *TestStudentA) Answer3() string {
	return "Answer 3"
}

type TestStudentB struct {
	TestPaper
}

func NewTestStudentB() *TestStudentB {
	student := &TestStudentB{}
	student.TestPaper = NewTestPaper(student)
	return student
}

func (t *TestStudentB) Answer1() string {
	return "Answer A"
}

func (t *TestStudentB) Answer2() string {
	return "Answer B"
}

func (t *TestStudentB) Answer3() string {
	return "Answer C"
}

// main.go
package main

import (
	"fmt"

	template "design-patterns/08-template"
)

func main() {
	studentA := template.NewTestStudentA()
	studentA.TestQuestion1()
	studentA.TestQuestion2()
	studentA.TestQuestion3()

	fmt.Println("")

	studentB := template.NewTestStudentB()
	studentB.TestQuestion1()
	studentB.TestQuestion2()
	studentB.TestQuestion3()
}
```
::: tip
这里为了模仿抽象类，用到了一个小技巧，即在 `TestPaper` 结构体中嵌入了一个接口类型的字段，然后在 `NewTestPaper` 函数中将接口类型的实例传入，这样就可以实现类似抽象类的效果。

不过这样也有两个缺点：

- 实例化的时候需要调用两次构造函数，一次是 `NewTestPaper`，一次是 `NewTestStudentA` 或 `NewTestStudentB`。
- 如果直接实例化`TestPaper`那么它不能传入类型为`ITest`的参数，因为其没有完全实现`ITest`接口。（这一点和TS的抽象类区别开来）
:::


::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks/125536630) <br>
参考书籍：[《大话设计模式》](http://www.tup.tsinghua.edu.cn/booksCenter/book_09792501.html)

:::