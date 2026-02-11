---
title: Mutex踩坑与拓展
order: 6
isOriginal: true
cover: https://images.icestream32.cn/images/2025/04/24/Dity-Pretty-111636622.png
category:
    - 计算机
    - 读书笔记
    - 并发编程
tag:
    - Golang
    - Mutex
---

又度过了一段忙碌的日子，终于有时间继续更新了，本次我们来学习一下Mutex的踩坑与拓展。

<!-- more -->

## 常见易错点

### Lock/Unlock 不是成对出现

Lock/Unlock 没有成对出现，就意味着会出现死锁的情况，或者是因为Unlock一个未加锁的Mutex而导致panic。

缺少Unlock的情况：

1. 代码中有太多的if-else分支，可能在某个分支中漏写了Unlock；

2. 在重构的时候把Unlock给删除了；

3. Unlock误写成了Lock。

这种情况下，goruntine获取锁后，也无法释放，因为没有Unlock，其他goruntine也无法获取到锁。

缺少Lock的情况：

一般这种情况是在重构的时候，不小心把Lock给删除了，此时程序只有Unlock，运行时会panic。

### 复制已使用的Mutex

Go的sync包下的同步原语在使用后都是不可复制的，从前面源码解读可知，Mutex是有状态的，如果复制已使用的Mutex，会导致状态混乱，从而导致死锁。

这种情况一般发生在函数结构体传参使用传值的方式中，如下：

```go
package main

import (
	"fmt"
	"sync"
)

type Counter struct {
	sync.Mutex
	Count int
}

func main() {
	var c Counter
	c.Lock()
	defer c.Unlock()
	c.Count++

	foo(c) // 复制锁
}

func foo(c Counter) {
	c.Lock()
	defer c.Unlock()
	fmt.Println("in foo")
}
```

此时运行会直接报错：

```
fatal error: all goroutines are asleep - deadlock!
```

这是因为foo函数接收的是c的副本，而c的锁已经被main函数持有，所以foo函数在尝试加锁时会导致死锁。

那么传入指针是否可行呢？答案是不可行，因为这种情况下就变成了可重入锁，这种情况会在下文说明。

```go
func foo(c *Counter) {
	c.Lock()
	defer c.Unlock()
	fmt.Println("in foo")
}
```

另外，Go提供了一个工具，可在编译时检查是否存在复制Mutex的情况，使用方法如下：

```bash
go vet main.go
```

此时命令行会输出：

```
# command-line-arguments
# [command-line-arguments]
.\main.go:19:6: call of foo copies lock value: command-line-arguments.Counter
.\main.go:22:12: foo passes lock by value: command-line-arguments.Counter
```

::: tip
- go vet 检查是通过copylock分析器静态分析实现的。这个分析器会分析函数调用、range 遍历、复制、声明、函数返回值等位置，有没有锁的值 copy 的情景，以此来判断有没有问题。

- 对于可重入的情况，go vet 无法检查
:::

### 重入

介绍一下可重入锁的概念：

可重入锁，是指当一个线程获取到锁后，可以重复获取锁，而不会阻塞并且成功返回，使用场景一般在递归函数中，因此也叫递归锁。

Go的sync.Mutex是不可重入的，参考前面源码解析可以知道，Mutex本身并没有记录持有锁的goroutine，所以无法判断当前持有锁的goroutine是否是当前goroutine，所以无法实现可重入。

因此，参考上述例子，如果foo函数传入的是指针，是同一份锁，运行时同样会报错。

可重入锁是可以自己实现的，下文会介绍可重入锁的实现。

### 死锁

死锁是指两个或多个goroutine在互相等待对方释放锁，从而导致程序无法继续执行的情况，常见的场景如下：

- 哲学家进餐问题

- 读者写者问题

这个场景相信大家学习过计算机操作系统课程，都有所了解，在这里就不过多赘述了。

## 拓展

### 可重入锁

我们可以通过获取goruntine id来实现可重入锁，获取goruntine id的方式有很多种，但是为了方便，我们使用第三方库[goid](https://github.com/petermattis/goid)。

安装方式如下：

```bash
go get github.com/petermattis/goid
```

实现如下：

```go
type RecursiveMutex struct {
	mu        sync.Mutex
	owner     int64 // 持有锁的goroutine id
	recursion int32 // 重入次数
}

func (rm *RecursiveMutex) Lock() {
	gid := goid.Get()
	if atomic.LoadInt64(&rm.owner) == gid {
		rm.recursion++
		return
	}

	rm.mu.Lock()
	atomic.StoreInt64(&rm.owner, gid)
    // 第一次调用，重入次数为1
	rm.recursion = 1
}

func (rm *RecursiveMutex) Unlock() {
	gid := goid.Get()
	if atomic.LoadInt64(&rm.owner) != gid {
		panic("wrong owner")
	}

	rm.recursion--
    // 还没有释放完，直接返回
	if rm.recursion != 0 {
		return
	}

	atomic.StoreInt64(&rm.owner, 0)
	rm.mu.Unlock()
}
```

套用上面那个例子，使用如下：

```go
type Counter struct {
	RecursiveMutex
	Count int
}

func main() {
	var c Counter
	c.Lock()
	defer c.Unlock()
	c.Count++

	foo(&c)
}

func foo(c *Counter) {
	c.Lock()
	defer c.Unlock()
	fmt.Println("in foo")
}
```

运行完全没问题，可以正常输出。

> 注意：可重入锁调用多少次Lock，就需要调用多少次Unlock，否则会导致死锁。

### 获取 state 相关指标

众所周知，在sync.Mutex中，state字段是用来存储锁的状态的，在一些特殊场景（比如说metrics监控）下我们需要了解有多少个等待者，饥饿状态，那么我们是否可以获取到state字段的相关指标呢？

答案是肯定的，使用unsafe包即可。

代码示例如下：

```go
package mutex

import (
	"sync"
	"sync/atomic"
	"unsafe"
)

// MutexState 定义了互斥锁的状态位
const (
	// mutexLocked 表示锁是否被持有
	mutexLocked = 1 << iota
	// mutexWoken 表示是否有等待者被唤醒
	mutexWoken
	// mutexStarving 表示锁是否处于饥饿状态
	mutexStarving
	// mutexWaiterShift 表示等待者数量的位移
	mutexWaiterShift = iota
)

// Mutex 是对标准库 sync.Mutex 的扩展，提供了额外的状态监控功能
type Mutex struct {
	sync.Mutex
}

// Count 返回当前等待获取锁的 goroutine 数量加上锁的持有状态
// 返回值 >= 1 表示锁被持有，> 1 表示有等待者
func (m *Mutex) Count() int {
	if m == nil {
		return 0
	}

	state := atomic.LoadInt32((*int32)(unsafe.Pointer(&m.Mutex)))
	waiters := state >> mutexWaiterShift
	locked := state & mutexLocked

	return int(waiters + locked)
}

// IsLocked 检查锁是否被持有
func (m *Mutex) IsLocked() bool {
	if m == nil {
		return false
	}

	state := atomic.LoadInt32((*int32)(unsafe.Pointer(&m.Mutex)))
	return state&mutexLocked == mutexLocked
}

// IsWoken 检查是否有等待者被唤醒
func (m *Mutex) IsWoken() bool {
	if m == nil {
		return false
	}

	state := atomic.LoadInt32((*int32)(unsafe.Pointer(&m.Mutex)))
	return state&mutexWoken == mutexWoken
}

// IsStarving 检查锁是否处于饥饿状态
func (m *Mutex) IsStarving() bool {
	if m == nil {
		return false
	}

	state := atomic.LoadInt32((*int32)(unsafe.Pointer(&m.Mutex)))
	return state&mutexStarving == mutexStarving
}

```

测试程序如下，在1000个goroutine并发访问的情况下，获取到state字段的相关指标：

```go
func count() {
	var mu mutex.Mutex
	for range 1000 { // 启动1000个goroutine
		go func() {
			mu.Lock()
			time.Sleep(time.Second)
			mu.Unlock()
		}()
	}

	for {
		time.Sleep(time.Second)
		// 输出锁的信息
		fmt.Printf("waitings: %d, isLocked: %t, woken: %t,  starving: %t\n", mu.Count(), mu.IsLocked(), mu.IsWoken(), mu.IsStarving())
	}
}
```

部分输出结果如下：

```
waitings: 999, isLocked: true, woken: false,  starving: false
waitings: 998, isLocked: true, woken: false,  starving: false
waitings: 997, isLocked: true, woken: false,  starving: false
waitings: 996, isLocked: true, woken: false,  starving: false
```

### 实现一个线程安全的队列

Mutex同步原语提供了十分基础的同步功能，在实际使用中，我们可能需要和数据结构结合起来使用，比如说队列，那么如下即为一个线程安全的队列：

```go
package queue

import "sync"

type Queue[T any] struct {
	mu    sync.Mutex
	queue []T
}

func NewQueue[T any]() *Queue[T] {
	return &Queue[T]{
		queue: make([]T, 0),
	}
}

func (q *Queue[T]) Enqueue(v T) {
	q.mu.Lock()
	defer q.mu.Unlock()

	q.queue = append(q.queue, v)
}

func (q *Queue[T]) Dequeue() (T, bool) {
	q.mu.Lock()
	defer q.mu.Unlock()

	if len(q.queue) == 0 {
		var zero T
		return zero, false
	}

	v := q.queue[0]
	q.queue = q.queue[1:]

	return v, true
}
```

该队列可以为类型T的队列提供线程安全的Enqueue和Dequeue操作。

## 总结

以上就是Mutex的踩坑与拓展，至此，Mutex的章节就结束了，下一章节我们将学习RWMutex。

::: info

封面来源: [Pixiv](https://www.pixiv.net/artworks/111636622) <br>
参考资料: [《深入理解Go并发编程》](https://item.jd.com/14283252.html)

:::
