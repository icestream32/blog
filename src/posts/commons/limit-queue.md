---
title: 通过队列来限制并发访问
shortTitle: 限流队列
index: true
isOriginal: true
order: 4
category:
    - 计算机
    - Web
tag:
    - 网络请求
    - 限流
    - 队列
    - TypeScript
    - Golang
cover: https://images.icestream32.cn/images/2024/11/09/71187447_p0_master1200.jpg
---

最近在对接第三方接口的时候，在日志中发现总是会报错[429](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/429)，因此做了个限流器，限制同一时间的请求并发数，以保证每个请求都不会被拦截。

<!-- more -->

## 选定限制条件

按照 MDN 文档的说法，先去日志查看 429 响应的详情头有没有`Retry-After`请求头，如果有的话那么限流条件就根据这个请求的值来设定，没有的话就自己定一个限制条件

![image-20241113112309690](https://images.icestream32.cn/images/2024/11/13/image-20241113112309690.png)

在我对接的第三方中，对方明显没有给我这个响应头，因此假定每次最大并发量为`2`，请求间隔`500毫秒`。

## 解决思路

假设有一个队列`queue`，当前队列长度为`length`，最大并发量为`limit`，请求间隔为`timeout`。队列中存储着一个个任务`task`，这个`request`实际上就是向第三方发送请求的请求方法。

队列没有任务即队列为空时，队列挂起（进入睡眠状态），不占用主线程资源。

如果有请求方法需要执行时，程序会先把这个请求方法放入队列中，等待队列执行。此时队列会唤醒并根据最大并发量和请求间隔依次有序执行入队的请求方法。

## 代码实现

::: tabs

@tab TypeScript

TS 可以通过`Promise/await`实现限流队列。

::: details 点击查看代码

```ts
type TTask = () => Promise<void>;

class Queue {
  // 任务队列
  private queue: TTask[] = [];

  // 最大并发数量
  private limit: number;

  // 当前并发数量
  private current: number;

  // 请求间隔
  private timeout: number;

  // 当前任务的 Promise
  private currentPromise: Promise<void> = Promise.resolve();

  // 任务队列为空时的 Promise
  private idlePromise: Promise<void> = Promise.resolve();

  public constructor(limit: number = 2, timeout: number = 500) {
    this.limit = limit;
    this.timeout = timeout;
  }

  // 添加任务到队列
  public enqueue(task: TTask) {
    this.queue.push(task);
    this.idlePromise = Promise.resolve();
  }

  public async start(): Promise<void> {
    // 当前并发数量已经达到限制
    if (this.current >= this.limit) {
      return;
    }

    // 当前队列为空，暂时挂起
    if (this.queue.length === 0) {
      await this.idlePromise;
    }

    // 当前并发数量 +1
    this.current++;

    // 从队列中取出任务
    const tasks: TTask[] = [];
    while (this.queue.length > 0 && tasks.length < this.limit) {
      tasks.push(this.queue.shift()!);
    }

    const startTask = async () => {
      await this.currentPromise; // 等待前一个任务完成
      await Promise.all(tasks.map((task) => task())); // 并行处理任务
      await new Promise((resolve) => setTimeout(resolve, this.timeout)); // 请求间隔

      this.current--; // 当前并发数量 -1
      this.start(); // 递归调用，处理下一次并发任务
    };

    // 更新 currentPromise，使下一个任务等待当前任务的完成
    this.currentPromise = startTask();

    // 检查队列是否还有任务
    if (this.queue.length === 0) {
      this.idlePromise = this.currentPromise;
    }
  }
}

// 创建模拟任务
function createTask(name: string): TTask {
  return async () => {
    console.log(`开始处理任务: ${name}`);
    console.log(`任务完成: ${name}`);
  };
}

async function runTask(queue: Queue): Promise<void> {
  queue.enqueue(createTask("Task-1"));
  queue.enqueue(createTask("Task-2"));
  queue.enqueue(createTask("Task-3"));
  queue.enqueue(createTask("Task-4"));
  queue.enqueue(createTask("Task-5"));
  queue.enqueue(createTask("Task-6"));
}

(async () => {
  // 测试示例
  const queue = new Queue();

  runTask(queue);
  queue.start();

  // 阻塞个五秒
  await new Promise((resolve) => setTimeout(resolve, 5000));

  queue.enqueue(createTask("我又加了一个任务"));
  console.log(233);
})().catch(console.error);
```

::: details 点击查看输出结果

输出结果如下：

```
开始处理任务: Task-1
任务完成: Task-1
开始处理任务: Task-2
任务完成: Task-2
开始处理任务: Task-3
任务完成: Task-3
开始处理任务: Task-4
任务完成: Task-4
开始处理任务: Task-5
任务完成: Task-5
开始处理任务: Task-6
任务完成: Task-6 // 此时队列为空了，让出主线程
233 // 处理主线程代码
开始处理任务: 我又加了一个任务 // 又有一个任务入队，继续处理
任务完成: 我又加了一个任务
```

主函数里面执行结束之后会阻塞在`await this.idlePromise;`这行代码中，所以程序运行不会退出。

@tab Golang

Go 通过`container/list`包来模拟队列，同时通过`sync`包和`time`包来实现并发控制。

::: details 点击查看代码

```go
package main

import (
	"container/list"
	"fmt"
	"sync"
	"time"
)

// 定义任务类型
type Task func()

// Queue 定义任务队列和相关属性
type Queue struct {
	queue   *list.List    // 存放任务的队列
	limit   int           // 最大并发量
	current int           // 当前并发量
	timeout time.Duration // 请求间隔
	wg      sync.WaitGroup
	mutex   sync.Mutex
}

func NewQueue(limit int, timeout time.Duration) *Queue {
	return &Queue{
		queue:   list.New(),
		limit:   limit,
		current: 0,
		timeout: timeout,
	}
}

func (queue *Queue) Enqueue(task Task) {
	queue.mutex.Lock()
	defer queue.mutex.Unlock()

	queue.queue.PushBack(task)
}

func (queue *Queue) Start() {
	go func() {
		for {
			if queue.queue.Len() == 0 {
				queue.wg.Wait()
			}

			if queue.current >= queue.limit {
				continue
			}

			queue.mutex.Lock()

			// 从队列中根据最大并发量和队列长度取出任务
			var tasks []Task
			for i := 0; i < queue.queue.Len(); i++ {
				if i >= queue.limit {
					break
				}

				tasks = append(tasks, queue.queue.Remove(queue.queue.Front()).(Task))
				queue.current++
			}

			// 并发执行任务
			for _, task := range tasks {
				queue.wg.Add(1)
				go func(task Task) {
					defer func() {
						fmt.Println("任务执行完成")

						queue.wg.Done()
						queue.current--
					}()
					task()
				}(task)
			}

			// 请求间隔
			time.Sleep(queue.timeout)

			queue.mutex.Unlock()
		}
	}()
}

func main() {
	queue := NewQueue(2, 500*time.Millisecond)

	for i := 0; i < 6; i++ {
		queue.Enqueue(func() {
			fmt.Printf("任务 %d\n", i)
		})
	}

	queue.Start()

	queue.Enqueue(func() {
		fmt.Println("我又加了一个任务")
	})

	fmt.Println("测试是否阻塞")

	time.Sleep(10 * time.Second) // 等待任务执行完成
}
```

Go 在主协程退出之后不论子协程是否在运行都会直接被销毁，因此在`main`函数的代码最后加了一个睡眠，让子协程执行结束之后再退出（但真实 HTTP 服务器主协程正常情况下不可能退出哈）。

输出如下：

::: details 点击查看输出结果

```
测试是否阻塞 // 根本不会阻塞，直接第一个输出
任务 1
任务执行完成
任务 0
任务执行完成
任务 3
任务执行完成
任务 2
任务执行完成
任务 4
任务执行完成
任务 5
任务执行完成
我又加了一个任务
任务执行完成
```

:::

## 总结

解决思路还是挺简单的，代码实现比较难，需要对 TS 和 Go 的异步编程要有一定的理解，TS 和 Go 的异步实现感觉还是差距挺大，写的时候两边思路不能完全套用。

::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks/71187447) <br>
文档参考：[MDN Web Docs](https://developer.mozilla.org/zh-CN/)

:::
