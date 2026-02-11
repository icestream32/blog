---
title: 观察者模式
isOriginal: true
order: 11
cover: https://images.icestream32.cn/images/2025/01/13/67759389_p0_master1200.jpg
category:
    - 计算机
    - 读书笔记
    - 设计模式
tag:
    - 观察者模式
    - TypeScript
    - Golang
---

观察者模式（Observer Pattern）是一种行为设计模式，它允许一个对象（称为主题）将其状态的改变通知给其他对象（称为观察者）。这种模式定义了一种一对多的依赖关系，让多个观察者对象同时监听某一个主题对象，这个主题对象在状态发生变化时会通知所有观察者对象，使它们能够自动更新。

<!-- more -->

## 书中案例实现

情景：老板或者前台通知工位上的人员

### UML 类图

@startuml
interface Observer {
    +update(): void
}

interface Subject {
    +attach(observer: Observer): void
    +detach(observer: Observer): void
    +notify(): void
}

class Boss {
    -observers: Observer[]
    +attach(observer: Observer): void
    +detach(observer: Observer): void
    +notify(): void
}

class Secretary {
    -observers: Observer[]
    +attach(observer: Observer): void
    +detach(observer: Observer): void
    +notify(): void
}

class StockObserver {
    +update(): void
}

class NBAObserver {
    +update(): void
}

Observer <|.. StockObserver
Observer <|.. NBAObserver

Subject <|.. Boss
Subject <|.. Secretary

Subject <.. StockObserver
Subject <.. NBAObserver
@enduml

### 代码实现

```ts
interface Observer {
    update(): void;
}

interface Subject {
    attach(observer: Observer): void;
    detach(observer: Observer): void;
    notify(): void;
}

class StockObserver implements Observer {
    private _name: string;
    private _subject: Subject;

    constructor(name: string, subject: Subject) {
        this._name = name;
        this._subject = subject;
    }

    public update() {
        console.log(`${this._name} is notified. Stop watching stock and go back to work.`);
    }
}

class NBAObserver implements Observer {
    private _name: string;
    private _subject: Subject;

    constructor(name: string, subject: Subject) {
        this._name = name;
        this._subject = subject;
    }

    public update() {
        console.log(`${this._name} is notified. Stop watching NBA and go back to work.`);
    }
}

class Boss implements Subject {
    private _observers: Observer[] = [];

    public attach(observer: Observer) {
        this._observers.push(observer);
    }

    public detach(observer: Observer) {
        const index = this._observers.indexOf(observer);
        this._observers.splice(index, 1);
    }

    public notify() {
        console.log('Boss is coming!');
        for (const observer of this._observers) {
            observer.update();
        }
    }
}

class Secretary implements Subject {
    private _observers: Observer[] = [];

    public attach(observer: Observer) {
        this._observers.push(observer);
    }

    public detach(observer: Observer) {
        const index = this._observers.indexOf(observer);
        this._observers.splice(index, 1);
    }

    public notify() {
        console.log('Secretary is coming!');
        for (const observer of this._observers) {
            observer.update();
        }
    }
}

(async () => {
    const boss = new Boss();
    const secretary = new Secretary();

    const stockObserver1 = new StockObserver('stockObserver1', boss);
    const stockObserver2 = new StockObserver('stockObserver2', secretary);
    const nbaObserver1 = new NBAObserver('nbaObserver1', secretary);
    const nbaObserver2 = new NBAObserver('nbaObserver2', boss);

    boss.attach(stockObserver1);
    boss.attach(nbaObserver2);
    secretary.attach(stockObserver2);
    secretary.attach(nbaObserver1);

    boss.detach(stockObserver1);

    boss.notify();
    secretary.notify();

    // 输出如下：
    // Boss is coming!
    // nbaObserver2 is notified. Stop watching NBA and go back to work.
    // Secretary is coming!
    // stockObserver2 is notified. Stop watching stock and go back to work.
    // nbaObserver1 is notified. Stop watching NBA and go back to work.
})()
```

## 总结

1. 什么时候会用到观察者模式？

- 当一个对象的改变需要同时改变其他对象，而且它不知道具体有多少对象有待改变时，应该考虑使用观察者模式。

- 当一个抽象模型有两个方面，其中一个方面依赖于另一个方面，这时使用观察者模式可以将这两者封装在独立的对象中使它们各自独立地改变和复用。

总而言之，观察者模式所做的工作其实就是在解除耦合，让耦合的双方都依赖于抽象，而不是依赖于具体，从而使得各自的变化都不会影响到另一边的变化。

2. 观察者模式的不足

在观察者模式中，抽象主题（Subject）还是依赖抽象观察者（Observer），但如果主题和观察之间根本就互相不知道，而由客户端来决定通知谁，而且主题通知的到具体观察者的行为也是不同的，那么统一的主题接口就不适用。

为了解决这一办法，可以将观察者模式改造为事件委托类型的观察者模式，这样就可以在不同的观察者上注册不同的事件处理程序，从而实现不同的行为。

代码实现如下：

- `StockObserver`结构体和`NBAObserver`结构体，去掉了父结构体`Observer`，并且将`update`方法改为了各自的方法名。
```go
type StockObserver struct {
	Name string
	Sub  Subject
}

func (so *StockObserver) CloseStockMarket() {
	fmt.Printf("%s %s 关闭股票行情，继续工作！\n", so.Sub.SubjectState(), so.Name)
}

type NBAObserver struct {
	Name string
	Sub  Subject
}

func (nba *NBAObserver) CloseNBADirectSeeding() {
	fmt.Printf("%s %s 关闭NBA直播，继续工作！\n", nba.Sub.SubjectState(), nba.Name)
}
```

- 由于`Subject`不希望依赖`Observer`，所以`Attach`和`Detach`方法也没必要了（`Observer`已经不存在了）

```go
type Subject interface {
	SubjectState() string
	Notify()
}
```

- 事件处理

定义一个事件处理类型，然后在结构体中注册事件处理函数，并提供触发事件的函数。

```go
// 事件处理函数类型
type EventHandler func()

// 事件类型
type Event struct {
	handlers []EventHandler
}

// 注册事件处理函数
func (e *Event) Register(handler EventHandler) {
	e.handlers = append(e.handlers, handler)
}

// 触发事件
func (e *Event) Invoke() {
	for _, handler := range e.handlers {
		handler()
	}
}
```

- 客户端

客户端中将各自观察者的方法注册到事件中，当事件触发时，执行对应的方法。

```go
func main() {
	boss := &observer.Boss{
		Name: "胡汉三",
	}

	tongshi1 := &observer.StockObserver{
		Name: "张三",
		Sub:  boss,
	}
	tongshi2 := &observer.NBAObserver{
		Name: "李四",
		Sub:  boss,
	}

	boss.Update.Register(tongshi1.CloseStockMarket)
	boss.Update.Register(tongshi2.CloseNBADirectSeeding)

	boss.Action = "我胡汉三回来了！"
	boss.Notify()

	// 输出：
	// 我胡汉三回来了！ 张三 关闭股票行情，继续工作！
	// 我胡汉三回来了！ 李四 关闭NBA直播，继续工作！
}
```

通过事件委托类型的观察者模式，可以实现不同的观察者注册不同的事件处理函数，从而实现不同的行为。

3. 委托的特点？

- 委托就是一种引用方法的类型，一旦为委托分配了方法，委托将与该方法具有完全相同的行为。

- 委托方法的使用可以和其他方法一样，具有参数和返回值，其可以看做是对函数的抽象，是函数的“类”，委托的实例将代表一个具体的函数。

- 一个委托可以搭载多个方法，所有方法被依次唤起，它**可以使得委托对象所搭载的方法并不需要属于同一个类**。

4. 委托的限制？

委托对象所搭载的所有方法必须具有相同的参数列表和返回值类型。

::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks/125828651) <br>
参考书籍：[《大话设计模式》](http://www.tup.tsinghua.edu.cn/booksCenter/book_09792501.html)

:::