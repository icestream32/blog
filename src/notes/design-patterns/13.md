---
title: 备忘录模式
isOriginal: true
order: 13
cover: https://images.icestream32.cn/images/2025/02/24/118143641_p0_master1200.jpg
category:
    - 计算机
    - 读书笔记
    - 设计模式
tag:
    - 备忘录模式
    - TypeScript
    - Golang
---

备忘录模式（Memento Pattern），在不破坏封装性的前提下，捕获一个对象的内部状态，并在该对象之外保存这个状态。这样以后就可将该对象恢复到原先保存的状态。

<!-- more -->

## 书中案例实现

情景：游戏角色状态恢复

### UML 类图

@startuml
left to right direction

class GameRole {
    +vitality: number
    +attack: number
    +defense: number
    +saveState(): RolteStateMemento
    +recoveryState(memento: RolteStateMemento): void
}

class RolteStateMemento {
    +vitality: number
    +attack: number
    +defense: number
}

class RoleStateCaretaker {
    +memento: RolteStateMemento
}

GameRole --|> RolteStateMemento
RolteStateMemento o-- RoleStateCaretaker

@enduml

### 代码实现

::: tabs

@tab TypeScript

```ts
// 游戏角色
class GameRole {
    private _vit: number = 0;
    private _atk: number = 0;
    private _def: number = 0;

    public get vit(): number {
        return this._vit;
    }

    public get atk(): number {
        return this._atk;
    }

    public get def(): number {
        return this._def;
    }

    public initState(): void {
        this._vit = 100;
        this._atk = 100;
        this._def = 100;
    }

    public saveState(): GameRoleMemento {
        return new GameRoleMemento(this._vit, this._atk, this._def);
    }

    public fight(): void {
        this._vit = 0;
        this._atk = 0;
        this._def = 0;
    }

    public recoverState(memento: GameRoleMemento): void {
        this._vit = memento.vit;
        this._atk = memento.atk;
        this._def = memento.def;
    }

    public display(): void {
        console.log(this._vit, this._atk, this._def);
    }
}

// 游戏角色备忘录
class GameRoleMemento {
    private _vit: number = 0;
    private _atk: number = 0;
    private _def: number = 0;

    constructor(vit: number, atk: number, def: number) {
        this._vit = vit;
        this._atk = atk;
        this._def = def;
    }

    public get vit(): number {
        return this._vit;
    }

    public get atk(): number {
        return this._atk;
    }

    public get def(): number {
        return this._def;
    }
}

// 角色状态管理者
class GameRoleStateCaretaker {
    private _memento: GameRoleMemento;

    public get memento(): GameRoleMemento {
        return this._memento;
    }

    public set memento(memento: GameRoleMemento) {
        this._memento = memento;
    }
}

(async () => {
    // 大战Boss前
    const gameRole = new GameRole();
    gameRole.initState();
    gameRole.display();

    // 保存进度
    const stateCaretaker = new GameRoleStateCaretaker();
    stateCaretaker.memento = gameRole.saveState();

    // 大战Boss时，损耗严重
    gameRole.fight();
    gameRole.display();

    // 恢复之前状态
    gameRole.recoverState(stateCaretaker.memento);
    gameRole.display();
})();
```

@tab Golang

```go
// memento.go
package memento

import "fmt"

type GameRole struct {
	vit int
	atk int
	def int
}

func NewGameRole() *GameRole {
	return &GameRole{
		vit: 100,
		atk: 100,
		def: 100,
	}
}

func (r *GameRole) Display() {
	fmt.Printf("当前角色状态: 生命力: %d, 攻击力: %d, 防御力: %d\n", r.vit, r.atk, r.def)
}

func (r *GameRole) Save() *GameRoleMemento {
	return &GameRoleMemento{
		vit: r.vit,
		atk: r.atk,
		def: r.def,
	}
}

func (r *GameRole) Init() {
	r.vit = 100
	r.atk = 100
	r.def = 100
}

func (r *GameRole) Recover(memento *GameRoleMemento) {
	r.vit = memento.vit
	r.atk = memento.atk
	r.def = memento.def
}

func (r *GameRole) Fight() {
	r.vit = 0
	r.atk = 0
	r.def = 0
}

type GameRoleMemento struct {
	vit int
	atk int
	def int
}

func (m *GameRoleMemento) GetVit() int {
	return m.vit
}

func (m *GameRoleMemento) GetAtk() int {
	return m.atk
}

func (m *GameRoleMemento) GetDef() int {
	return m.def
}

type GameRoleCaretaker struct {
	memento *GameRoleMemento
}

func NewGameRoleCaretaker() *GameRoleCaretaker {
	return &GameRoleCaretaker{}
}

func (c *GameRoleCaretaker) GetMemento() *GameRoleMemento {
	return c.memento
}

func (c *GameRoleCaretaker) SetMemento(memento *GameRoleMemento) {
	c.memento = memento
}

// main.go
func main() {
	// 大战Boss前
	role := memento.NewGameRole()
	role.Init()
	role.Display()

	// 保存进度
	caretaker := memento.NewGameRoleCaretaker()
	caretaker.SetMemento(role.Save())

	// 大战Boss时，损耗严重
	role.Fight()
	role.Display()

	// 恢复之前状态
	role.Recover(caretaker.GetMemento())
	role.Display()
}
```

:::

## 总结

1. 备忘录模式的主要优点是：

   - 它提供了一种状态恢复机制，使得用户可以方便地撤销和恢复到之前的状态。

   - 它通过将状态的保存和恢复分离，降低了发起者和备忘录之间的耦合度。

   - 它允许用户在运行时动态地保存和恢复状态，而不需要修改发起者的代码。

2. 应用场景：

   - 需要保存和恢复数据的一系列操作，如撤销/重做操作。

   - 需要封装对象的内部状态，使得外部代码不能直接修改对象的状态。

   - 需要支持对象的版本管理，如版本回退。

::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks/118143641) <br>
参考书籍：[《大话设计模式》](http://www.tup.tsinghua.edu.cn/booksCenter/book_09792501.html)

:::