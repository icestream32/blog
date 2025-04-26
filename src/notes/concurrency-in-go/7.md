---
title: RWMutex
order: 7
isOriginal: true
cover: https://images.icestream32.cn/images/2025/04/24/pasoputi-127665548.png
category:
    - 计算机
    - 读书笔记
    - 并发编程
tag:
    - Golang
    - RWMutex
---

在读者写者问题中，如果采用Mutex互斥锁，当存在大量读者并且读操作支持并发时，阻塞会导致性能下降，因此读写锁就是为了提高此类场景并发性能而设计的。

<!-- more -->

## 使用方法

与写锁相关的方法如下：

- `Lock()`：获取写锁。如果暂时获取不到，则会被阻塞，知道获取到写锁。

- `TryLock()`：尝试获取写锁。如果获取不到，则直接返回false。

- `Unlock()`：释放写锁。

与读锁相关的方法如下：

- `RLock()`：获取读锁。如果暂时获取不到，则会被阻塞，直到获取到读锁。

- `TryRLock()`：尝试获取读锁。如果获取不到，则直接返回false。

- `RUnlock()`：释放读锁。

- `RLocker()`：返回一个读锁的Locker接口。

## 实现原理

读者写者问题一般有三类，基于对读和写操作的优先级，读写锁的设计和实现也分成三类：

- 读优先：读优先的设计可以提供很高的并发性，但是在竞争激烈的情况下会导致写饥饿。

- 写优先：如果有writer在等待锁，那么阻止所有新来的reader获取到锁，这种设计主要避免了writer的饥饿问题。

- 不指定优先级：读写锁的实现不指定优先级，读写锁的实现会根据读写操作的频率来决定优先级。

**Go标准库中的RWMutex是基于Mutex实现的，设计为写优先方案，一个正在阻塞的Lock调用会排除新的reader请求到锁。**

以下的源码会移除掉类似于race的检查相关的代码，只保留核心的实现逻辑。

RWMutex结构体定义如下：

```go
type RWMutex struct {
    // Go Mutex
	w         Mutex

	writerSem uint32 // writer信号量
	readerSem uint32 // reader信号量

    // 这个字段有两个含义
    // 1. 当readerCount >= 0时，表示当前活跃的读者数量​
    // 2. 当readerCount < 0时，表示等待获取写锁的writer数量（负值基准+剩余读者数）
	readerCount atomic.Int32
    // 写锁等待时需要阻塞的读者数量​​
	readerWait  atomic.Int32
}

// 最大读锁数量，相当于十进制的1073741824
const rwmutexMaxReaders = 1 << 30
```

### Lock

```go
func (rw *RWMutex) Lock() {
    // 解决其他writer竞争问题
    rw.w.Lock()

    // 反转readerCount，告诉reader有writer竞争锁
    // 通过减去rwmutexMaxReaders将readerCount变为负值，阻塞后续读锁获取
    // 举例：
    // readerCount = 10 - rwMutexMaxReaders = 1073741824
    // 那么 r = 10（实际取值为原子操作后的结果加上最大值，即当前活跃的读者数）
    r := atomic.AddInt32(&rw.readerCount, -rwmutexMaxReaders) + rwmutexMaxReaders

    // 如果当前有reader持有锁，那么需要等待
    // 将活跃读者数r累加到readerWait，记录需要等待的读者数量
    // 当readerWait被后续的reader递减至0时，会唤醒等待的writer
    if r != 0 && atomic.AddInt32(&rw.readerWait, r) != 0 {
        // 内部方法，信号量等待
        // 当仍有未完成的reader时，将当前writer挂起在writerSem上
        runtime_SemacquireMutex(&rw.writerSem, false, 0)
    }
}
```

可以看到，当前如果有reader持有锁的话，那么新来的writer也会阻塞等待，遵循“先来后到”的原则，保证公平性。

同一时刻的业务先等之前的业务完成之后才开始执行，如果都是写操作优先级高，那么如果一直写的操作进来，那么读操作会不停地累计阻塞等待，越来越多，那更加不可接受。

### RLock/RUnlock

```go
func (rw *RWMutex) RLock() {
    // 增加活跃读者计数（原子操作，保证并发安全）
    // 返回值是加1后的新值，若结果为负说明存在等待的writer（writer调用Lock时会减去rwmutexMaxReaders使readerCount变为负）
    // 当检测到有writer等待时，当前reader需要阻塞在readerSem信号量上（避免writer饥饿）
    // 若结果非负，说明无writer等待，直接获取读锁成功
    if atomic.AddInt32(&rw.readerCount, 1) < 0 {
        // 在readerSem上挂起当前goroutine，等待最后一个writer完成后的唤醒
        runtime_SemacquireMutex(&rw.readerSem, false, 0)
    }
}

func (rw *RWMutex) RUnlock() {
    // 减少活跃读者计数（原子操作，保证并发安全）
    // 返回值r是减1后的新值，若结果为负说明存在等待的writer（此时readerCount已被writer设置为负数基准）
    // 当检测到有writer等待时，需要进入慢路径处理可能的唤醒逻辑
    if r := atomic.AddInt32(&rw.readerCount, -1); r < 0 {
        // 慢路径处理：传递当前原子操作后的readerCount值（此时为负数基准+剩余读者数）
        rw.rUnlockSlow(r) // 需要处理writer等待的场景
    }
    // 若r >=0 说明无writer等待，直接完成读锁释放
}

func (rw *RWMutex) rUnlockSlow(r int32) {
    // 原子递减等待唤醒的读者计数（该值在writer调用Lock时被设置为当时的活跃读者数）
    // 当且仅当readerWait减到0时，说明当前writer等待期间的所有活跃reader均已释放读锁
    // 此时需要唤醒等待的writer，使其可以继续获取写锁
    if atomic.AddInt32(&rw.readerWait, -1) == 0 {
        // 释放writerSem信号量，唤醒等待的writer（由最后一个完成解锁的reader触发）
        // 参数说明：释放1个信号量，采用handoff机制（保证唤醒优先级）
        runtime_Semrelease(&rw.writerSem, false, 1)
    }
    // 若结果不为0，说明仍有其他reader持有读锁，writer需继续等待
}
```

### Unlock

```go
func (rw *RWMutex) Unlock() {
    // 恢复readerCount的正值状态（原子操作，保证并发安全）
    // 将readerCount从负值基准（-rwmutexMaxReaders + x）恢复为正值x，返回的r即为当前需要唤醒的阻塞reader数量
    // 例如：
    // 写锁持有期间readerCount = -rwmutexMaxReaders + 5（表示有5个reader被阻塞）
    // 此时AddInt32(rwmutexMaxReaders)的结果为5，即r=5
    r := atomic.AddInt32(&rw.readerCount, rwmutexMaxReaders)
    
    // 唤醒所有被当前写锁阻塞的reader（数量为r）
    // 每个被Lock期间新增的reader都阻塞在readerSem上，需要逐个释放信号量
    // 注意这里必须唤醒全部阻塞reader（不能漏唤醒，否则会导致reader永久阻塞）
    for i := 0; i < int(r); i++ {
        // 释放readerSem信号量，唤醒一个阻塞的reader
        // 参数说明：不采用handoff机制（读锁允许并发，无需优先级控制）
        runtime_Semrelease(&rw.readerSem, false, 0)
    }
    
    // 释放底层互斥锁，允许其他writer竞争
    // 注意这个操作必须在唤醒所有reader之后，保证写锁的互斥性
    rw.w.Unlock()
}
```

### TryLock

TryLock方法的实现十分简单，只需要对readerCount进行操作和判断即可

```go
func (rw *RWMutex) TryLock() bool {
    // 尝试获取底层互斥锁（解决writer间竞争）
    // 若失败说明已有其他writer持有锁，直接返回false
    if !rw.w.TryLock() {
        return false
    }

    // 关键状态检查：原子操作验证当前无活跃reader
    // 期望readerCount为0（无活跃reader）时，将其设为负值基准（-rwmutexMaxReaders）
    // 若CAS失败，说明存在活跃reader或其他writer已修改状态，需回滚互斥锁
    if !atomic.CompareAndSwapInt32(&rw.readerCount, 0, -rwmutexMaxReaders) {
        // 回滚已获取的互斥锁（避免死锁）
        rw.w.Unlock()
        return false
    }

    // 成功获取写锁，返回true
    return true
}
```

### TryRLock

TryRLock方法的实现也十分简单，只需要对readerCount进行操作和判断即可

需要注意的是，检测假设大多数时间没有写竞争，通过重试处理冲突，避免在低竞争场景下使用互斥锁。

```go
func (rw *RWMutex) TryRLock() bool {
    // 无锁循环检测，避免在低竞争场景下使用互斥锁
    for {
        // 原子加载当前读者计数器（保证内存可见性）
        c := rw.readerCount.Load()

        // 快速失败条件：若计数器为负值，说明有writer持有锁或正在等待
        // 此时遵循写优先原则，立即返回失败（非阻塞设计的核心）
        if c < 0 {
            return false
        }

        // 尝试原子递增读者计数器（CAS保证原子性）
        // 若CAS成功，说明无并发冲突，成功获取读锁
        // 若CAS失败，说明其他goroutine修改了readerCount（可能是读锁增减或写锁介入）
        // 需要循环重试直到条件稳定
        if rw.readerCount.CompareAndSwap(c, c+1) {
            return true
        }
    }
}
```

读写锁RWMutex的核心源码就这么多，主要是要理解readerCount和readerWait的含义，以及两个信号量在方法中是如何协作控制读写锁的。

## 易错点

### 不可复制

RWMutex是不可复制的，因为它的结构体中包含Mutex，Mutex是不可复制的。

### 不可重入

同上，因为Mutex不可重入，所以RWMutex也是不可重入的。

以下场景会因为重入而报错：

1. 函数传参

这种场景和前面Mutex重入的场景是一样的，这里就不赘述了。

2. reader读操作中调用Lock写操作

如果我们在 reader 的读操作时调用 writer 的写操作（它会调用 Lock 方法），那么这个 reader 和 writer 就会形成互相依赖的死锁状态。

Reader 想等待 writer 完成后再释放锁，而 writer 需要这个 reader 释放锁之后，才能不阻塞地继续执行。这是一个读写锁常见的死锁场景。

代码示例如下：

```go
package main

import (
	"sync"
)

var (
	mu sync.RWMutex          // 读写锁
	ch = make(chan struct{}) // 用于同步的通道
)

func reader() {
	mu.RLock()         // 获取读锁
	defer mu.RUnlock() // 确保最终释放读锁

	// 这里触发写操作（关键错误点）
	go writer()

	// 等待写操作完成的信号（永远不会收到）
	<-ch
}

func writer() {
	// 这里会阻塞，因为reader持有读锁
	mu.Lock()
	defer mu.Unlock()

	// 这个信号永远不会被发送
	ch <- struct{}{}
}

func main() {
	reader()
}
```

3. 递归环境下多reader问题

当 writer 请求写锁时，若存在活跃 reader，会等待其完成。此时若这些活跃 reader 又尝试获取新的读锁（例如在递归调用中），新 reader 的 `RLock()` 会因 writer 的 pending 状态（readerCount < 0）而阻塞，形成死锁链：

1. writer等待活跃reader释放
2. 活跃reader等待新reader完成（业务逻辑依赖）
3. 新reader等待writer释放（因写锁优先机制）

举个例子，比如说递归计算斐波那契数列：

```go
func main() {
    var mu sync.RWMutex

    // writer,稍微等待，然后制造一个调用Lock的场景
    go func() {
        time.Sleep(200 * time.Millisecond)
        mu.Lock()
        fmt.Println("Lock")
        time.Sleep(100 * time.Millisecond)
        mu.Unlock()
        fmt.Println("Unlock")
    }()

    go func() {
        factorial(&mu, 10) // 计算10的阶乘, 10!
    }()
    
    select {}
}

// 递归调用计算阶乘
func factorial(m *sync.RWMutex, n int) int {
    if n < 1 { // 阶乘退出条件 
        return 0
    }

    fmt.Println("RLock")

    m.RLock()
    defer func() {
        fmt.Println("RUnlock")
        m.RUnlock()
    }()

    time.Sleep(100 * time.Millisecond)

    return factorial(m, n-1) * n // 递归调用
}
```

出现问题的原因如下：

1. 递归栈的锁延迟释放机制

defer语句遵循LIFO执行顺序，在递归调用中表现为：最深层函数优先执行RUnlock，外层函数逆序释放锁

2. 写锁优先机制

- 主协程200ms后激活writer，此时递归链已建立3层读锁

- writer尝试获取Lock时进入写等待队列，阻塞所有后续读锁请求

3. 读锁抢占限制机制

- 当存在活跃写等待时，新到达的reader（第4次递归调用）将被阻塞在RLock

- 形成双向等待链：

`reader(3rd) → 持有读锁 → 等待递归完成 → 依赖外层锁释放`
`writer      → 等待读锁释放 → 阻塞后续读锁`
`reader(4th) → 等待写锁释放 → 形成循环依赖`

时序图如下：

```
0ms       reader启动，获取RLock(3rd)
100ms     reader进入RLock(2nd)
200ms     writer尝试获取Lock（进入等待）
300ms     reader尝试RLock(1st)
400ms     第4次递归请求被writer阻塞
→ 永久等待链形成
```

第三种场景错误十分隐蔽，因此尽量不要在递归场景使用读写锁。

如果实在要使用，推荐使用第三方库[go-deadlock](https://github.com/sasha-s/go-deadlock)，它可以帮助我们检测死锁，并且使用方式和标准库的Mutex、RWMutex保持一致，不需要更改。

这个库在运行时会监控goroutine的锁请求，如果发现死锁，会输出详细的死锁信息，帮助我们定位问题。

比如说上面的代码，会输出如下：

```
RLock
RLock
POTENTIAL DEADLOCK: Recursive locking:
current goroutine 4 lock 0xc000016108
main.go:38 main.factorial { m.RLock() } <<<<<
..\..\pkg\mod\github.com\sasha-s\go-deadlock@v0.3.5\deadlock.go:140 go-deadlock.(*RWMutex).RLock { func (m *RWMutex) RLock() { }
main.go:45 main.factorial {  }
main.go:24 main.main.func2 { factorial(&mu, 10) // 计算10的阶乘, 10! }

Previous place where the lock was grabbed (same goroutine)
main.go:38 main.factorial { m.RLock() } <<<<<
..\..\pkg\mod\github.com\sasha-s\go-deadlock@v0.3.5\deadlock.go:140 go-deadlock.(*RWMutex).RLock { func (m *RWMutex) RLock() { }
main.go:24 main.main.func2 { factorial(&mu, 10) // 计算10的阶乘, 10! }

exit status 2
```

所以如果发现自己代码里面出现了死锁，不妨将标准库的Mutex换成go-deadlock的Mutex，然后运行一下，说不定会有发现。

```go
import (
    sync "github.com/sasha-s/go-deadlock"
)
```

## 总结

读写锁为性能优化而生，一开始我们可以先使用Mutex，但是如果发现性能瓶颈，可以考虑使用读写锁。

当然，如果一开始的使用场景就是读多写少的场景，那么就可以考虑使用读写锁。

还有读写锁的拓展，通过unsafe包获取一些指标，做法同上一篇博客一致，这里就不赘述了。

::: info

封面来源: [Pixiv](https://www.pixiv.net/artworks/127665548) <br>
参考资料: [《深入理解Go并发编程》](https://item.jd.com/14283252.html)

:::