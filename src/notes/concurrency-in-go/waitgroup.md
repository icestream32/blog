---
title: WaitGroup
order: 8
isOriginal: true
cover: https://images.icestream32.cn/images/2025/04/24/Sally--125256814.png
category:
    - 计算机
    - 读书笔记
    - 并发编程
tag:
    - Golang
    - WaitGroup
---

WaitGroup 是 Go 语言中常用的并发编程工具，用于等待一组 goroutines 完成。它提供了一种简单的方式来协调多个 goroutines 的执行，并确保它们在所有任务完成之前不会退出。

<!-- more -->

## 基本用法

Go 标准库中的 WaitGroup 提供了三个方法，如下：

```go
func (wg *WaitGroup) Add(delta int)
func (wg *WaitGroup) Done()
func (wg *WaitGroup) Wait()
```

- `Add(delta int)`: 增加 WaitGroup 的计数器。
- `Done()`: 减少 WaitGroup 的计数器，实际上是 `Add(-1)`。
- `Wait()`: 阻塞等待 WaitGroup 的计数器变为 0。

下面是一个示例，分别为三个异步http请求，只有三个请求都完成之后，才会执行后续的逻辑。

```go
func FetchUrl(url string, wg *sync.WaitGroup) {
	defer wg.Done()

	resp, err := http.Get(url)
	if err != nil {
		fmt.Println("Error fetching URL:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading body:", err)
		return
	}

	fmt.Println("URL:", url, "Length:", len(body))
}

func main() {
	urls := []string{
		"https://www.baidu.com",
		"https://www.bing.com",
		"https://www.google.com",
	}

	var wg sync.WaitGroup
	wg.Add(len(urls))

	for _, url := range urls {
		go FetchUrl(url, &wg)
	}

	wg.Wait()

	fmt.Println("Done")
}
```

输出结果如下：

```
URL: https://www.baidu.com Length: 2443
URL: https://www.google.com Length: 17348
URL: https://www.bing.com Length: 12935
Done
```

## 实现原理

WaitGroup 结构体定义如下：

```go
type WaitGroup struct {
	// 防止复制使用该结构体
	noCopy noCopy

	// 高32位是计数器，低32位是等待者计数。
	state atomic.Uint64

	// 信号量
	sema uint32
}
```

::: tip

noCopy为辅助字段，主要为了vet工具检查，防止复制使用该结构体，关于这个字段的实现与设计，可以参考博客[noCopy]()

:::

同RWMutex一样，一些race等一些非核心代码在这里就不进行展开，下面主要分析核心的逻辑。

### Add

```go
func (wg *WaitGroup) Add(delta int) {
    // 将delta左移32位，然后与waitgroup的state相加
	state := wg.state.Add(uint64(delta) << 32)

    // 获取计数器数量
	v := int32(state >> 32)
    // 获取等待者数量
	w := uint32(state)

    // 如果计数器小于0，则panic
	if v < 0 {
		panic("sync: negative WaitGroup counter")
	}

    // 如果等待者数量大于0，并且delta大于0，并且计数器等于delta，则panic
	if w != 0 && delta > 0 && v == int32(delta) {
		panic("sync: WaitGroup misuse: Add called concurrently with Wait")
	}

    // 如果计数器大于0，或者等待者数量为0，则返回
    // 这个条件说明在计数器大于0或者没有等待者的情况下，不需要做后续的操作
	if v > 0 || w == 0 {
		return
	}

    // 如果state不等于state，则panic
    // 防止state被意外修改
	if wg.state.Load() != state {
		panic("sync: WaitGroup misuse: Add called concurrently with Wait")
	}

    // 将计数器设置为0
    // 因为上述判断中已经能够认为，所有任务已经完成，因此将计数器设置为0，并释放所有信号量
	wg.state.Store(0)

    // 释放信号量，一定要把所有等待者的信号量都释放掉，不然会导致死锁
	for ; w != 0; w-- {
		runtime_Semrelease(&wg.sema, false, 0)
	}
}
```

原理比较简单，其核心逻辑就是每次Add的时候都判断所有任务是否已经完成，如果已经完成，那么释放所有等待者的信号量。

还有一个值得注意的是一些异常情况的处理，这个会和WaitGroup的易错点有关，会在下文统一介绍。

### Done

Done实际上也是一个辅助函数，其核心逻辑就是调用Add(-1)。

```go
func (wg *WaitGroup) Done() {
	wg.Add(-1)
}
```

### Wait

```go
func (wg *WaitGroup) Wait() {
    // 阻塞等待
	for {
        // 原子操作获取state
		state := wg.state.Load()
        // 获取计数器数量
		v := int32(state >> 32)
        // 获取等待者数量
		w := uint32(state)

		// CAS操作，如果state没被改变，那么让state+1
        // state+1 实际上为增加一个等待者
		if wg.state.CompareAndSwap(state, state+1) {
            // 阻塞等待
			runtime_SemacquireWaitGroup(&wg.sema)

            // 如果state不等于0，则panic
            // 前一个 Wait 还没结束就重用 WaitGroup
			if wg.state.Load() != 0 {
				panic("sync: WaitGroup is reused before previous Wait has returned")
			}

			return
		}
	}
}
```

Wait的逻辑也很简单，实际上就是在一个无限循环中，不断通过原子操作获取state并进行比较，如果state不等于0，则阻塞等待，直到state等于0，然后释放信号量。

## 常见错误点

### 计数器设置为负值

一般情况下，会有两种操作会让计数器变成负数：

1. 调用Add时，传递一个负数

如代码示例，一开始调用Add(10)，然后调用Add(-10)，再调用Add(-1)，此时计数器为-1，那么会直接panic。

```go
func main() {
    var wg sync.WaitGroup

    wg.Add(10)

    wg.Add(-10) // 不会报错

    wg.Add(-1) // panic
}
```

对于此类错误，**建议不要传负数到Add()函数中，用辅助函数Done()来减少计数器**。

2. 调用Done的次数过多，超过了WaitGroup的计数值

**使用 WaitGroup 的正确姿势是，预先确定好 WaitGroup 的计数值，然后调用相同次数的 Done 完成相应的任务。**

如代码示例：

```go
func main() {
    var wg sync.WaitGroup
    
    wg.Add(1)

    wg.Done()

    wg.Done() // panic
}
```

这类错误点对应的源码检查条件为：

```go
if v < 0 {
    panic("sync: negative WaitGroup counter")
}
```

### Add 的时机不对

在使用WaitGroup时，若在Wait()之前调用Add()，也会导致意想不到的结果或者panic。

代码示例中，启动四个goroutine，每个goroutine都调用Add(1)，然后调用Done()，主 gouroutine调用Wait()等待任务完成。

```go
func main() {
	var wg sync.WaitGroup
	go dosomething(100, &wg)
	go dosomething(110, &wg)
	go dosomething(120, &wg)
	go dosomething(130, &wg)

	wg.Wait()
	fmt.Println("Done")
}

func dosomething(millisecs time.Duration, wg *sync.WaitGroup) {
	duration := millisecs * time.Millisecond
	time.Sleep(duration) // 故意sleep一段时间

	wg.Add(1)
	fmt.Println("后台执行, duration:", duration)
	wg.Done()
}
```

代码看着能够顺利运行，但是实际输出结果却不对，如下：

```
Done
```

可以发现，子函数的内容都没输出，程序就执行结束了。

修改方法也很简单，只需要在主函数中调用Add(4)，提前定好WaitGroup的计数值，然后子函数中调用Done()即可。

### 前一个 Wait 还没结束就重用 WaitGroup

不像之前的Mutex、RWMutex，WaitGroup是可以重用的，但条件是要等待前一个Wait()结束。

示例代码如下：

```go
func main() {
	var wg sync.WaitGroup

	wg.Add(1)

	go func() {
		time.Sleep(time.Millisecond)
		wg.Done()
		wg.Add(1)
	}()

	wg.Wait() // 主goroutine等待，有可能和第7行并发执行
}
```

程序卡主一会之后就会发生panic，提示：

```
panic: sync: WaitGroup is reused before previous Wait has returned
```

这类错误点对应的源码检查条件为：

```go
if wg.state.Load() != 0 {
	panic("sync: WaitGroup is reused before previous Wait has returned")
}
```

## 总结

WaitGroup使用起来很简单，但是为了避免使用错误，需要遵循以下几条原则：

- 不重用 WaitGroup，新建耗费不了多少资源，没必要重用。

- 保证所有的Add方法调用都在Wait之前。

- 不传递负数为Add方法，只通过Done方法来给计数器减1.

- 不做多余的Done方法调用，保证Add的计数值和Done方法调用的数量是一样的。

- 不遗漏Done方法的调用，不然会导致死锁。

::: info

封面来源: [Pixiv](https://www.pixiv.net/artworks/125256814) <br>
参考资料: [《深入理解Go并发编程》](https://item.jd.com/14283252.html)

:::
