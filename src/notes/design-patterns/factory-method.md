---
title: 工厂方法模式
isOriginal: true
order: 6
cover: https://images.icestream32.cn/images/2024/11/09/84595361_p0_master1200.jpg
category:
    - 计算机
    - 读书笔记
    - 设计模式
tag:
    - 工厂方法模式
    - TypeScript
    - Golang
---

工厂方法模式（Factory Method Pattern）是一种创建型设计模式，是简单工厂模式的进一步抽象和推广，它提供了一种创建对象的最佳方式。

在工厂方法模式中，我们在父类中创建对象，但让子类决定要实例化的类。

<!-- more -->

## 计算器扩展

先前通过键盘输入两个数，然后选择运算符进行计算，现在我们将计算器扩展为工厂方法模式。

### UML类图

@startuml
interface ICalculator {
    +getResult(): number
}

class Add {
    -num1: number
    -num2: number
    +getResult(): number
}

class Sub {
    -num1: number
    -num2: number
    +getResult(): number
}

class Mul {
    -num1: number
    -num2: number
    +getResult(): number
}

class Div {
    -num1: number
    -num2: number
    +getResult(): number
}

class Pow {
    -num1: number
    -num2: number
    +getResult(): number
}

class Log {
    -num1: number
    -num2: number
    +getResult(): number
}

ICalculator <|.. Add
ICalculator <|.. Sub
ICalculator <|.. Mul
ICalculator <|.. Div

interface IFactory {
    +createCalculator(): ICalculator
}

class CalculatorFactory {
    +createCalculator(): ICalculator
}

class FactoryBasic {
    +createCalculator(): ICalculator
}

class FactoryAdvanced {
    +createCalculator(): ICalculator
}

IFactory <|.. FactoryBasic
IFactory <|.. FactoryAdvanced

FactoryBasic ..> Add
FactoryBasic ..> Sub
FactoryBasic ..> Mul
FactoryBasic ..> Div

FactoryAdvanced ..> Pow
FactoryAdvanced ..> Log

CalculatorFactory <.. ICalculator
@enduml

类图上，在工厂类上新增了一个`IFactory`接口，然后分别实现了基础运算工厂类`FactoryBasic`和高级运算工厂类`FactoryAdvanced`。
`CalculatorFactory`类作为工厂方法类，根据不同的运算类型选择不同的工厂类。

### 代码实现

::: tabs

@tab TypeScript

::: details 点击查看详细代码

```ts
interface ICalculator {
    getResult(num1: number, num2: number): number;
}

class Add implements ICalculator {
    public getResult(num1: number, num2: number): number {
        return num1 + num2;
    }
}

class Sub implements ICalculator {
    public getResult(num1: number, num2: number): number {
        return num1 - num2;
    }
}

class Mul implements ICalculator {
    public getResult(num1: number, num2: number): number {
        return num1 * num2;
    }
}

class Div implements ICalculator {
    public getResult(num1: number, num2: number): number {
        if (num2 === 0) {
            throw new Error('除数不能为0');
        }
        return num1 / num2;
    }
}

class Pow implements ICalculator {
    public getResult(num1: number, num2: number): number {
        // 参数校验忽略
        return Math.pow(num1, num2);
    }
}

class Log implements ICalculator {
    public getResult(num1: number, num2: number): number {
        // 参数校验忽略
        return Math.log(num2) / Math.log(num1);
    }
}

interface IFactory {
    createCalculator(operType: string): ICalculator;
}

class FactoryBasic implements IFactory {
    public createCalculator(operType: string): ICalculator {
        switch (operType) {
            case '+':
                return new Add();
            case '-':
                return new Sub();
            case '*':
                return new Mul();
            case '/':
                return new Div();
            default:
                throw new Error('unsupported operation');
        }
    }
}

class FactoryAdvanced implements IFactory {
    public createCalculator(operType: string): ICalculator {
        switch (operType) {
            case 'pow':
                return new Pow();
            case 'log':
                return new Log();

            // 此处可以继续扩展
            // 当前工厂类不会影响到基础运算工厂类
            default:
                throw new Error('unsupported operation');
        }
    }
}

class CalculatorFacotory {
    public static createFactory(operType: string): ICalculator {
        let factory: IFactory;
        switch (operType) {
            case '+':
            case '-':
            case '*':
            case '/':
                factory = new FactoryBasic();
                break;

            case 'pow':
            case 'log':
                factory = new FactoryAdvanced();
                break;
            default:
                throw new Error('unsupported operation');
        }

        return factory.createCalculator(operType);
    }
}

// 运行
(async () => {

    const calculator = CalculatorFacotory.createFactory('pow');
    const result = calculator.getResult(1, 2);

    console.log(`计算结果: ${result}`);
})()
```

@tab Golang

::: details 点击查看详细代码

```go
// factory_method.go
package factorymethod

import (
	"math"
)

// 定义接口
type ICaculator interface {
	GetResult(numberA, numberB float64) float64
}

type IFactory interface {
	createCalculator() ICaculator
}

// 基本运算（这里采用公共变量实现）
type Add struct{}

func (a *Add) GetResult(numberA, numberB float64) float64 {
	return numberA + numberB
}

type Sub struct{}

func (s *Sub) GetResult(numberA, numberB float64) float64 {
	return numberA - numberB
}

type Mul struct{}

func (m *Mul) GetResult(numberA, numberB float64) float64 {
	return numberA * numberB
}

type Div struct{}

func (d *Div) GetResult(numberA, numberB float64) float64 {
	if numberB == 0 {
		panic("除数不能为0")
	}
	return numberA / numberB
}

// 高等运算
type Pow struct{}

func (p *Pow) GetResult(numberA, numberB float64) float64 {
	// 忽略参数校验
	return math.Pow(numberA, numberB)
}

type Log struct{}

func (l *Log) GetResult(numberA, numberB float64) float64 {
	// 忽略参数校验
	return math.Log(numberB) / math.Log(numberA)
}

// 基础运算工厂类
type BasicFactory struct{}

func (ab *BasicFactory) createCalculator(operType string) ICaculator {
	switch operType {
	case "+":
		return &Add{}
	case "-":
		return &Sub{}
	case "*":
		return &Mul{}
	case "/":
		return &Div{}
	default:
		panic("不支持的运算类型")
	}
}

// 高等运算工厂类
type AdvancedFactory struct{}

func (a *AdvancedFactory) createCalculator(operType string) ICaculator {
	switch operType {
	case "pow":
		return &Pow{}
	case "log":
		return &Log{}
	default:
		panic("不支持的运算类型")
	}
}

// 工厂方法类
type CalculatorFactory struct{}

func (c *CalculatorFactory) CreateCalculator(operType string) ICaculator {
	switch operType {
	case "+", "-", "*", "/":
		return (&BasicFactory{}).createCalculator(operType)
	case "pow", "log":
		return (&AdvancedFactory{}).createCalculator(operType)
	default:
		panic("不支持的运算类型")
	}
}
// main.go
package main

import (
	factory "design-patterns/06-factory_method"
	"fmt"
)

func main() {
	// 生成工厂方法类
	factory := factory.CalculatorFactory{}
	// 调用工厂方法生成实例
	log := factory.CreateCalculator("log")
	fmt.Println(log.GetResult(1, 2))
}
```
:::

代码实现上，我们定义了一个`ICalculator`接口，然后实现了加减乘除四个基础运算类和两个高级运算类，接着定义了一个`IFactory`接口，分别实现了基础运算工厂类`FactoryBasic`和高级运算工厂类`FactoryAdvanced`，最后定义了一个`CalculatorFactory`类作为工厂方法类，根据不同的运算类型选择不同的工厂类。

以上是TS的实现方法，其实Golang的实现完全可以更简单，可以把计算器工厂方法类转成一个方法，如下：

```go
// factory_method.go
// ...
func CreateCalculator(operType string) ICaculator {
	switch operType {
	case "+", "-", "*", "/":
		return (&BasicFactory{}).createCalculator(operType)
	case "pow", "log":
		return (&AdvancedFactory{}).createCalculator(operType)
	default:
		panic("不支持的运算类型")
	}
}

// main.go
// ...
func main() {
    // 调用工厂方法生成实例
    instance := factory.CreateCalculator("pow")
    fmt.Println(instance.GetResult(1, 2))
}
```

## 商场收银程序再再升级

集成之前实现的程序，现在我们使用简单工厂+策略+装饰+工厂方法模式实现商场收银程序。

### UML类图

@startuml
interface ISale {
    +acceptCash(): number
}

class CashNormal {
    +acceptCash(): number
}

class CashSuper {
    +acceptCash(): number
}

ISale <|.. CashNormal
ISale <|.. CashSuper
CashSuper o-- ISale

class CashReturn {
    -condition: number
    -result: number
    +acceptCash(): number
}

class CashRebate {
    -rebate: number
    +acceptCash(): number
}

CashSuper <|-- CashReturn
CashSuper <|-- CashRebate

interface IFactory {
    +createCashModel(): ISale
}

class CashFactory {
    +createCashModel(): ISale
}

class CashRebateReturnFactory {
    +createCashModel(): ISale
}

class CashReturnRebateFactory {
    +createCashModel(): ISale
}

IFactory <|.. CashRebateReturnFactory
IFactory <|.. CashReturnRebateFactory

CashReturn <.. CashRebateReturnFactory
CashReturn <.. CashReturnRebateFactory
CashRebate <.. CashRebateReturnFactory
CashRebate <.. CashReturnRebateFactory

ISale <.. IFactory
CashFactory <.. ISale
@enduml

### 代码实现

::: tabs

@tab TypeScript

::: details 点击查看详细代码

```ts
interface ISale {
    acceptCash(money: number, num: number): number;
}

class CashNormal implements ISale {
    public acceptCash(money: number, num: number): number {
        return money * num;
    }
}

class CashSuper implements ISale {
    private _component: ISale;

    public decorate(component: ISale): void {
        this._component = component;
    }

    public acceptCash(money: number, num: number): number {
        let result: number = 0;
        if (this._component) {
            result = this._component.acceptCash(money, num);
        }

        return result;
    }
}

class CashRebate extends CashSuper {
    private moneyRebate: number = 1;

    constructor(moneyRebate: number) {
        super();
        this.moneyRebate = moneyRebate;
    }

    public acceptCash(price: number, num: number): number {
        const result = price * num * this.moneyRebate;
        return super.acceptCash(result, 1);
    }
}

class CashReturn extends CashSuper {
    private moneyCondition: number = 0;
    private moneyReturn: number = 0;

    constructor(moneyCondition: number, moneyReturn: number) {
        super();
        this.moneyCondition = moneyCondition;
        this.moneyReturn = moneyReturn;
    }

    public acceptCash(price: number, num: number): number {
        let result = price * num;
        if (result >= this.moneyCondition) {
            result = result - Math.floor(result / this.moneyCondition) * this.moneyReturn;
        }

        return super.acceptCash(result, 1);
    }
}

interface IFactory {
    createCashModel(moneyRebate: number, moneyCondition: number, moneyReturn: number): ISale;
}

class CashRebateReturnFactory implements IFactory {
    public createCashModel(
        moneyRebate: number,
        moneyCondition: number,
        moneyReturn: number
    ): ISale {
        const cashNormal = new CashNormal();
        const cashRebate = new CashRebate(moneyRebate);
        const cashReturn = new CashReturn(moneyCondition, moneyReturn);

        cashReturn.decorate(cashNormal);
        cashRebate.decorate(cashReturn);

        return cashRebate;
    }
}

class CashReturnRebateFactory implements IFactory {
    public createCashModel(
        moneyRebate: number,
        moneyCondition: number,
        moneyReturn: number
    ): ISale {
        const cashNormal = new CashNormal();
        const cashRebate = new CashRebate(moneyRebate);
        const cashReturn = new CashReturn(moneyCondition, moneyReturn);

        cashRebate.decorate(cashNormal);
        cashReturn.decorate(cashRebate);

        return cashReturn;
    }
}

class CashFactory {
    public createCashModel(
        type: number
    ): ISale {
        switch (type) {
            case 1:
                return new CashRebateReturnFactory().createCashModel(1, 1, 0);
            case 2:
                // 8折
                return new CashRebateReturnFactory().createCashModel(0.8, 1, 0);
            case 3:
                // 滿300送100
                return new CashReturnRebateFactory().createCashModel(1, 300, 100);
            case 4:
                // 先打8折再滿300送100
                return new CashRebateReturnFactory().createCashModel(0.8, 300, 100);
            case 5:
                // 先滿300送100再打8折
                return new CashReturnRebateFactory().createCashModel(0.8, 300, 100);
            default:
                return new CashNormal();
        }
    }
}

(async () => {
    const factory = new CashFactory();
    const cash = factory.createCashModel(1);
    console.log(cash.acceptCash(500, 2)); // 1000
    const cash2 = factory.createCashModel(2);
    console.log(cash2.acceptCash(500, 2)); // 800
    const cash3 = factory.createCashModel(3);
    console.log(cash3.acceptCash(500, 2)); // 700
    const cash4 = factory.createCashModel(4);
    console.log(cash4.acceptCash(500, 2)); // 600
    const cash5 = factory.createCashModel(5);
    console.log(cash5.acceptCash(500, 2)); // 560
})();
```

@tab Golang

::: details 点击查看详细代码

```go
// factory_method.go
package factorymethod

type ISale interface {
	AcceptCash(money float64, num uint64) float64
}

// 原价类
type CashNormal struct{}

func (c *CashNormal) AcceptCash(money float64, num uint64) float64 {
	return money * float64(num)
}

// 打折类
type CashRebate struct {
	moneyRebate float64
	component   ISale
}

func (c *CashRebate) AcceptCash(money float64, num uint64) float64 {
	result := money * float64(num) * c.moneyRebate
	if c.component != nil {
		return c.component.AcceptCash(result, 1)
	}
	return result
}

// 满减类
type CashReturn struct {
	moneyCondition float64
	moneyReturn    float64
	component      ISale
}

func (c *CashReturn) AcceptCash(money float64, num uint64) float64 {
	result := money * float64(num)
	if result >= c.moneyCondition {
		result -= float64(int(result/c.moneyCondition)) * c.moneyReturn
	}
	if c.component != nil {
		return c.component.AcceptCash(result, 1)
	}
	return result
}

// 工厂接口
type ICashFactory interface {
	CreateCashModel() ISale
}

// 打折+满减工厂
type CashRebateReturnFactory struct {
	moneyRebate    float64
	moneyCondition float64
	moneyReturn    float64
}

func (c *CashRebateReturnFactory) CreateCashModel() ISale {
	cashNormal := &CashNormal{}
	cashRebate := &CashReturn{
		moneyCondition: c.moneyCondition,
		moneyReturn:    c.moneyReturn,
		component:      cashNormal,
	}
	cashReturn := &CashRebate{
		moneyRebate: c.moneyRebate,
		component:   cashRebate,
	}
	return cashReturn
}

// 满减+打折工厂
type CashReturnRebateFactory struct {
	moneyRebate    float64
	moneyCondition float64
	moneyReturn    float64
}

func (c *CashReturnRebateFactory) CreateCashModel() ISale {
	cashNormal := &CashNormal{}
	cashReturn := &CashRebate{
		moneyRebate: c.moneyRebate,
		component:   cashNormal,
	}
	cashRebate := &CashReturn{
		moneyCondition: c.moneyCondition,
		moneyReturn:    c.moneyReturn,
		component:      cashReturn,
	}
	return cashRebate
}

// 工厂方法
func CreateCashFactory(factoryType uint8) ISale {
	switch factoryType {
	case 1:
		// 原价
		return &CashNormal{}
	case 2:
		// 打8折
		factory := &CashRebateReturnFactory{moneyRebate: 0.8}
		return factory.CreateCashModel()
	case 3:
		// 满300减100
		factory := &CashReturnRebateFactory{moneyRebate: 1, moneyCondition: 300, moneyReturn: 100}
		return factory.CreateCashModel()
	case 4:
		// 先打8折，再满300减100
		factory := &CashRebateReturnFactory{moneyRebate: 0.8, moneyCondition: 300, moneyReturn: 100}
		return factory.CreateCashModel()
	case 5:
		// 先满300减100，再打8折
		factory := &CashReturnRebateFactory{moneyRebate: 0.8, moneyCondition: 300, moneyReturn: 100}
		return factory.CreateCashModel()
	default:
		return &CashNormal{}
	}
}
// main.go
package main

import (
	factory "design-patterns/06-factory_method"
	"fmt"
)

func main() {
	cashFactory := factory.CreateCashFactory(1)
	fmt.Println(cashFactory.AcceptCash(500, 2)) // 1000
	cashFactory = factory.CreateCashFactory(2)
	fmt.Println(cashFactory.AcceptCash(500, 2)) // 800
	cashFactory = factory.CreateCashFactory(3)
	fmt.Println(cashFactory.AcceptCash(500, 2)) // 700
	cashFactory = factory.CreateCashFactory(4)
	fmt.Println(cashFactory.AcceptCash(500, 2)) // 600
	cashFactory = factory.CreateCashFactory(5)
	fmt.Println(cashFactory.AcceptCash(500, 2)) // 560
}
```

:::

通过以上代码实现，本人更加深入的了解了Go组合式设计的用法，通过组合的方式实现了像TS、Java那样的extends继承，精髓代码如下：

```go
// ...
func (c *CashRebateReturnFactory) CreateCashModel() ISale {
	cashNormal := &CashNormal{}
	cashRebate := &CashReturn{
		moneyCondition: c.moneyCondition,
		moneyReturn:    c.moneyReturn,
		component:      cashNormal, // 这里实现了类似于继承的效果
	}
	cashReturn := &CashRebate{
		moneyRebate: c.moneyRebate,
		component:   cashRebate, // 这里实现了类似于继承的效果
	}
	return cashReturn
}
// ...
```

在工厂创建类时，装饰用的类作为一个属性传入，同时生成的对象也会被作为一个属性被“装饰”到下一个装饰类中，这样就实现了类似于继承的效果。

## 总结

学完工厂方法模式，差不多对本人即将要在工作中要做的审批流程设计有了一定的思路，现在借以上内容暂时理一波预设节点思路：

1. 首先定义一个预设流程接口，里面包含审批方法，审批造成的结果。

2. 然后定义一个审批流类，实现预设流程接口，里面拥有具体的实现方法，主要是生成审批流程、节点以及记录。

3. 定义一个审批流工厂类，根据不同的审批流类型`flowKey`选择不同的审批流类。

这么说，貌似简单工厂就能实现？不好评价，等着学习后面的设计模式再来看看。

::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks/84595361) <br>
参考书籍：[《大话设计模式》](http://www.tup.tsinghua.edu.cn/booksCenter/book_09792501.html)

:::