---
title: MySQL数据迁移至ES（未完结）
isOriginal: true
category:
    - 计算机
    - 数据库
tag:
    - MySQL
    - Elasticsearch
    - 数据迁移
---

<!-- more -->

## 准备

1. 确认数据量

运行Sql语句可查看数据量：

```sql
select count(*) from production_device_process_logs; -- 27339059 差不多有3000万条数据
```

2. 确定mysql - es 数据结构映射

在es中，空字符串、null、json都有可能在插入时被忽略，所以对其进行额外处理：

```
"" -> "N/A"
null -> "N/A"
json -> 序列化成字符串
```

其余字段类型映射如下：

| MySQL | ES |
| --- | --- |
| int | long |
| bigint | long |
| unsigned int | long |
| unsigned bigint | long |
| varchar | keyword |
| text | text |
| datetime | date |

3. 建立索引

通过Restful API建立索引：

```bash
curl -X PUT "localhost:9200/production_device_process_logs" -H 'Content-Type: application/json' -d
# 后面加具体结构
```

## 编写迁移脚本

本次迁移脚本使用Go语言编写，涉及到的库如下：

```
github.com/spf13/viper                      // 读取配置文件
gorm.io/driver/mysql                        // mysql驱动
gorm.io/gorm                                // gorm库
github.com/elastic/go-elasticsearch/v8      // es库
github.com/panjf2000/ants/v2                // ants 协程池
github.com/bytedance/sonic                  // json序列化
```

### 主要思路&核心代码

1. 定义model&连接数据库

- 对processData和casuse字段特殊处理

```go
type ProcessData string

type Cause string

func (processData *ProcessData) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type")
	}

	*processData = ProcessData(bytes)
	return nil
}

func (processData ProcessData) Value() (driver.Value, error) {
	return sonic.Marshal(processData)
}

func (cause *Cause) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type")
	}

	str := Cause(bytes)
	if str == "" {
		*cause = "N/A"
	} else {
		*cause = str
	}
	return nil
}

func (cause Cause) Value() (driver.Value, error) {
	if cause == "N/A" {
		return nil, nil
	}
	return []byte(cause), nil
}
```

- 连接数据库
```go
package database

import (
	"fmt"

	"github.com/spf13/viper"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error

	// 从配置文件中读取数据库配置
	v := viper.New()
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")
	v.AddConfigPath("../")

	if err := v.ReadInConfig(); err != nil {
		panic(fmt.Errorf("fatal error config file: %s", err))
	}

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		v.GetString("db.username"),
		v.GetString("db.password"),
		v.GetString("db.host"),
		v.GetInt("db.port"),
		v.GetString("db.database"),
	)

	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(fmt.Errorf("fatal error connect database: %s", err))
	}
}
```

2. 连接es

```go
package database

import (
	"fmt"

	elastic "github.com/elastic/go-elasticsearch/v8"
	"github.com/spf13/viper"
)

var ES *elastic.Client

func InitES() {

	var err error

	// 从配置文件中读取数据库配置
	v := viper.New()
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")
	v.AddConfigPath("..")

	if err := v.ReadInConfig(); err != nil {
		panic(fmt.Errorf("fatal error config file: %s", err))
	}

	cfg := elastic.Config{
		Addresses: []string{
			fmt.Sprintf("http://%s:%d", v.GetString("es.host"), v.GetInt("es.port")),
		},
		Username: v.GetString("es.username"),
		Password: v.GetString("es.password"),
	}

	ES, err = elastic.NewClient(cfg)
	if err != nil {
		panic(fmt.Errorf("fatal error connect elasticsearch: %s", err))
	}
}
```

3. 读取mysql数据并插入es

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"mes-migration/database"
	"mes-migration/models"
	"strings"
	"sync"
	"time"

	"github.com/elastic/go-elasticsearch/v8/esapi"
)

const (
	batchSize     = 1000            // 增大批次大小
	maxConcurrent = 10              // 最大并发数
	retryCount    = 3               // 失败重试次数
	retryDelay    = 1 * time.Second // 重试延迟
)

func init() {
	database.InitES()
	database.InitDB()
}

func main() {
	var wg sync.WaitGroup
	logsChan := make(chan []models.ProductionDeviceProcessLog, maxConcurrent)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 启动消费者
	for i := 0; i < maxConcurrent; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for logs := range logsChan {
				if err := bulkInsertWithRetry(logs); err != nil {
					fmt.Printf("最终插入失败: %v\n", err)
				}
			}
		}()
	}

	// 生产者
	var lastID uint64 = 0
	for {
		var logs []models.ProductionDeviceProcessLog
		result := database.DB.Model(&models.ProductionDeviceProcessLog{}).
			Where("id > ?", lastID).
			Order("id ASC").
			Limit(batchSize).
			Find(&logs)

		if result.Error != nil || len(logs) == 0 {
			break
		}

		select {
		case logsChan <- logs:
			lastID = logs[len(logs)-1].Id
		case <-ctx.Done():
			break
		}
	}

	close(logsChan)
	wg.Wait()
}

// 带重试的批量插入
func bulkInsertWithRetry(logs []models.ProductionDeviceProcessLog) error {
	var err error
	for i := 0; i < retryCount; i++ {
		if err = bulkInsert2ES(logs); err == nil {
			return nil
		}
		time.Sleep(retryDelay)
	}
	return fmt.Errorf("插入失败: %w", err)
}

// 批量插入函数
func bulkInsert2ES(logs []models.ProductionDeviceProcessLog) error {
	var bulkBody strings.Builder
	bulkBody.Grow(len(logs) * 500) // 预分配内存

	for _, log := range logs {
		meta := fmt.Sprintf(`{ "index" : { "_id" : "%d" } }%s`, log.Id, "\n")
		data, _ := json.Marshal(log)
		body := fmt.Sprintf(`{"doc":%s}%s`, data, "\n") // 使用doc格式更高效

		bulkBody.WriteString(meta)
		bulkBody.WriteString(body)
	}

	req := esapi.BulkRequest{
		Index:   "production_device_process_logs",
		Body:    strings.NewReader(bulkBody.String()),
		Refresh: "false", // 关闭实时刷新提升性能
		Timeout: 30 * time.Second,
	}

	res, err := req.Do(context.Background(), database.ES)
	if err != nil {
		return fmt.Errorf("请求失败: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("ES错误响应: %s", res.String())
	}

	fmt.Printf("批量插入成功，插入数量: %d\n", len(logs))

	return nil
}
```