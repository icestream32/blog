---
title: Once
order: 9
isOriginal: true
cover:
category:
    - 计算机
    - 读书笔记
    - 并发编程
tag:
    - Golang
    - Once
---

Once 是 Go 语言中用于确保某个操作只执行一次的工具，它提供了一种简单的方式来确保某个操作在多个 goroutine 中只执行一次，通常会被使用到数据库驱动连接、配置初始化等场景。

<!-- more -->

## 基本用法

```go
type Once struct {
    // 防止复制
	_ noCopy
    // 原子类型 表示操作是否已经执行
	done atomic.Bool
    // 互斥锁
	m    Mutex
}
```

Once 只有一个方法 Do，它接受一个函数作为参数，并确保该函数只执行一次。

## 原理

源码也比较简单，如下：

```go
func (o *Once) Do(f func()) {
	// 注意：这里是一个错误的 Do 实现示例：
	//
	//	if o.done.CompareAndSwap(0, 1) {
	//		f()
	//	}
	//
	// Do 方法需要保证当它返回时，f 已经执行完成。
	// 上述错误实现无法保证这一点：当两个并发调用发生时，
	// CAS 操作成功的调用者会执行 f，而第二个调用会立即返回，
	// 不会等待第一个调用的 f 执行完成。
	// 这就是为什么慢路径需要回退到互斥锁，
	// 以及 o.done.Store 必须延迟到 f 返回之后才能执行的原因。

    // 快速预检查（无锁操作）用于初步筛选，如果操作已经执行过，则直接返回
	if !o.done.Load() {
		// 将慢路径代码单独提出，允许快路径被内联优化
		o.doSlow(f)
	}
}

func (o *Once) doSlow(f func()) {
    // ​互斥锁​​保证同一时间只有一个 goroutine 能进入临界区
    // 此时假设有多个 goroutine 同时调用Do，那么执行后都会卡在这，只有一个 goroutine 能获取到锁，其他 goroutine 会阻塞等待
	o.m.Lock()
	defer o.m.Unlock()

    // 在持有锁的状态下再次确认，防止其他 goroutine 已经修改过状态
	if !o.done.Load() {
        // 函数 f() 完全执行完毕后才会标记 done
		defer o.done.Store(true)
		f()
	}
}
```

这段摘自官方源代码，主要说明了为什么简单的CAS操作不能保证操作只执行一次，因此一个正确的Once实现要使用一个互斥锁，这样初始化的时候如果有并发的 goroutine，就会进入doSlow方法。

## 总结

Once同步原语虽然简单，但是使用场景非常广泛，举一个以前遇到的一个场景：

像在使用`viper`库时，一般要在一个文件中读取配置，然后初始化，那么假设读取到这个配置的结构体为`Config`，那么怎么将这个Config暴露出去呢？

以前我是这样干的，直接在包中声明一个`Config`变量，然后用init()函数初始化，示例代码如下：

```go
var Config *viper.Viper

func init() {
    // 初始化...
}
```

但是按照开发规范来说，直接暴露出包的变量实际上是不可取的，因此现在学习Once之后，可以这样干：

``` go
var (
    cfg *viper.Viper
    once sync.Once
)

func LoadConfig() *viper.Viper {
    once.Do(func () {
        // 初始化...
        cfg = &viper.Viper{}
    })

    return cfg
}
```

这样就保证了，配置初始化只执行一次，同时可以在这个方法中进行一些额外的初始化操作，像日志记录、错误处理等。

::: info

封面来源: [Pixiv](https://www.pixiv.net/artworks/) <br>
参考资料: [《深入理解Go并发编程》](https://item.jd.com/14283252.html)

:::
