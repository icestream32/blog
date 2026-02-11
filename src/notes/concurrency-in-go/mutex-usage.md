---
title: Mutex用法
redirectFrom: /notes/concurrency-in-go/3.html
order: 3
cover: https://images.icestream32.cn/images/2025/01/13/124956717_p0_master1200.jpg
category:
    - 计算机
    - 读书笔记
    - 并发编程
tag:
    - Golang
    - Mutex
---

<!-- more -->

## 使用介绍

Mutex使用起来十分简单，一共有三个方法：

- `Lock()`：获取锁
- `Unlock()`：释放锁
- `TryLock()`：尝试获取锁，Go 1.18版本才有（当然对于我这种小登来说都一视同仁的啦）

::: tip

- **即使一个goroutine没有持有锁，它也可以释放一个Mutex**

这是一个非常抽象的操作，但最好是要遵守“谁持有，谁释放”的原则。

- **如果直接释放一个未加锁的Mutex，它会直接报panic**

这种情况属于逻辑bug，因此在编程时要注意这一点。

:::

- `Lock()`和`Unlock()`的使用方法：

请看以下一个简单计数器的例子

```go
func TestCounter(t *testing.T) {
	var counter uint64

	var wg sync.WaitGroup
	var mutex sync.Mutex

	for i := 0; i < 64; i++ {
		wg.Add(1)

		go func() {
			for i := 0; i < 1000000; i++ { // 每个goroutine累加1000000次
				mutex.Lock() // 对计数值的更改进行加锁保护，避免数据竞争
				counter++
				mutex.Unlock()
			}
			wg.Done()
		}()
	}

	wg.Wait()

	if counter != 64*1000000 {
		t.Errorf("counter = %d", counter)
	}
}
```

众所周知，`counter++`这行代码并不是一个原子操作，可以拆分为三个步骤：

```go
temp := counter
temp = temp + 1
counter = temp
```

因此，如果不加锁，多个goroutine同时对`counter`进行操作，就会出现数据竞争的问题。因此，我们使用`sync.Mutex`对`counter`进行加锁保护，避免数据竞争。

- `TryLock()`的使用方法：

`TryLock()`方法是Go 1.18版本才有的，用于尝试获取锁，如果获取成功则返回true，否则返回false。这个方法可以在某些场景下，我们可能不想让此goroutine阻塞，而是允许它放弃进入临界区去做其他事情，这种时候就可以使用`TryLock()`方法。

```go
func TestTryLock(t *testing.T) {
	var mutex sync.Mutex

	// 加锁两秒
	go func() {
		mutex.Lock()
		time.Sleep(2 * time.Second)
		mutex.Unlock()
	}()

	time.Sleep(1 * time.Second)

	// 尝试获取锁 - 大概率获取不到
	if mutex.TryLock() {
		fmt.Println("获取锁成功")
		mutex.Unlock()
	} else {
		fmt.Println("获取锁失败")
	}
}
```

::: tip

`TryLock()`方法的可能使用场景：

- **超时机制**：在一定时间内尝试获取锁，如果获取不到则放弃
- **重试机制**：在获取锁失败后，可以进行一定次数的重试
- **优先级机制**：在获取锁失败后，可以根据优先级进行处理

:::

## 习惯用法

`Mutex`习惯用于其零值，而不是显示地初始化。

对于一个变量：

```go
var mu sync.Mutex

mu.Lock()
// do something
mu.Unlock()
```

对于一个结构体，不需要显示地初始化Mutex：

```go
type T struct {
    mu sync.Mutex
    n  map[int]int
}

var t = &T{
    n: make(map[int]int),
}

t.mu.Lock()
// do something
t.mu.Unlock()
```

## 检查程序中的数据竞争

数据竞争是并发程序中最常见的，也是最难以发现的并发问题，幸运的是，Go的`-race`标志可以帮助我们检查程序中的数据竞争。

```bash
go test -race mypkg    // 测试mypkg包
go run -race mysrc.go  // 运行时测试源文件
go build -race mycmd   // 编译时测试
go install -race mypkg // 安装时测试
```

`-race`标志会在程序运行时检查数据竞争，如果发现数据竞争，程序会直接panic，同时输出相关信息。以上面计数器的程序为例，带上`-race`标志后输出如下：

```bash
==================
WARNING: DATA RACE
Read at 0x00c0000142f8 by goroutine 22:
  concurrency-in-go/part02.TestCounter.func1()
      /home/icestream32/projects/go/src/concurrency-in-go/part02/part02_test.go:174 +0x44

Previous write at 0x00c0000142f8 by goroutine 10:
  concurrency-in-go/part02.TestCounter.func1()
      /home/icestream32/projects/go/src/concurrency-in-go/part02/part02_test.go:174 +0x56

Goroutine 22 (running) created at:
  concurrency-in-go/part02.TestCounter()
      /home/icestream32/projects/go/src/concurrency-in-go/part02/part02_test.go:172 +0x84
  testing.tRunner()
      /home/icestream32/projects/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.3.linux-amd64/src/testing/testing.go:1690 +0x226
  testing.(*T).Run.gowrap1()
      /home/icestream32/projects/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.3.linux-amd64/src/testing/testing.go:1743 +0x44

Goroutine 10 (running) created at:
  concurrency-in-go/part02.TestCounter()
      /home/icestream32/projects/go/src/concurrency-in-go/part02/part02_test.go:172 +0x84
  testing.tRunner()
      /home/icestream32/projects/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.3.linux-amd64/src/testing/testing.go:1690 +0x226
  testing.(*T).Run.gowrap1()
      /home/icestream32/projects/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.3.linux-amd64/src/testing/testing.go:1743 +0x44
==================
==================
WARNING: DATA RACE
Write at 0x00c0000142f8 by goroutine 9:
  concurrency-in-go/part02.TestCounter.func1()
      /home/icestream32/projects/go/src/concurrency-in-go/part02/part02_test.go:174 +0x56

Previous write at 0x00c0000142f8 by goroutine 10:
  concurrency-in-go/part02.TestCounter.func1()
      /home/icestream32/projects/go/src/concurrency-in-go/part02/part02_test.go:174 +0x56

Goroutine 9 (running) created at:
  concurrency-in-go/part02.TestCounter()
      /home/icestream32/projects/go/src/concurrency-in-go/part02/part02_test.go:172 +0x84
  testing.tRunner()
      /home/icestream32/projects/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.3.linux-amd64/src/testing/testing.go:1690 +0x226
  testing.(*T).Run.gowrap1()
      /home/icestream32/projects/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.3.linux-amd64/src/testing/testing.go:1743 +0x44

Goroutine 10 (running) created at:
  concurrency-in-go/part02.TestCounter()
      /home/icestream32/projects/go/src/concurrency-in-go/part02/part02_test.go:172 +0x84
  testing.tRunner()
      /home/icestream32/projects/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.3.linux-amd64/src/testing/testing.go:1690 +0x226
  testing.(*T).Run.gowrap1()
      /home/icestream32/projects/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.3.linux-amd64/src/testing/testing.go:1743 +0x44
==================
--- FAIL: TestCounter (0.49s)
    part02_test.go:183: counter = 42870790
    testing.go:1399: race detected during execution of test
FAIL
FAIL    concurrency-in-go/part02        0.508s
FAIL
```

在执行测试的时候加上`-race`参数，可以看到Go数据竞争检测器发现了数据竞争的问题（WARNING: DATA RACE），并且吧数据竞争的goruntine以及数据的创建、读/写信息都显示出来了，很方便我们分析数据竞争是怎么产生的。

如果不想对某些函数进行数据竞争的检查，则可以使用条件编译，用法如下：

```go
// go:build !race
```

测试的时候可以通过命令来指定函数是否进行数据竞争检查：

```bash
go test -race -run TestCounter .
```

::: tip

- `-race`参数需要CGO支持，同时需要GCC环境，命令如下：

```bash
go env -w CGO_ENABLED=1
sudo apt install gcc # ubuntu
```

windows安gcc环境贼麻烦，建议直接在linux环境下使用。。。

- 开启数据竞争是有代价的，会降低程序的性能。

在开启的情况下，内存占用可能增加5 ~ 10倍，运行时间可能增加2 ~ 20倍。

:::


::: info

封面来源: [Pixiv](https://www.pixiv.net/artworks/124956717) <br>
参考资料: [《深入理解Go并发编程》](https://item.jd.com/14283252.html)

:::
