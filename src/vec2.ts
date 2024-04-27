/* eslint-disable typescript/prefer-nullish-coalescing */
export class Vec2 {
  private _norm: number | undefined
  private _normalized: undefined | Vec2

  private _normSquared: number | undefined
  private readonly _x: number
  private readonly _y: number

  constructor(x: number, y: number) {
    this._x = x
    this._y = y
  }

  cross(that: Vec2): number {
    return this._x * that._y - this._y * that._x
  }

  dot(that: Vec2): number {
    return this._x * that._x + this._y * that._y
  }

  equals(that: Vec2, error: number): boolean {
    if (error === 0) {
      return this.x === that.x && this.y === that.y
    }
    return this.minus(that).normSquared < error * error
  }

  minus(that: Vec2): Vec2 {
    return new Vec2(this._x - that._x, this._y - that._y)
  }

  normal(): Vec2 {
    return new Vec2(this._y, -this._x)
  }

  over(s: number): Vec2 {
    return new Vec2(this._x / s, this._y / s)
  }

  plus(that: Vec2): Vec2 {
    return new Vec2(this._x + that._x, this._y + that._y)
  }

  times(s: number): Vec2 {
    return new Vec2(this._x * s, this._y * s)
  }

  toString(): string {
    return `(${this.x}, ${this.y})`
  }

  get norm(): number {
    return this._norm === undefined ? (this._norm = Math.sqrt(this.normSquared)) : this._norm
  }

  get normalized(): Vec2 {
    return this._normalized === undefined
      ? (this._normalized = this.over(this.norm))
      : this._normalized
  }

  get normSquared(): number {
    return this._normSquared === undefined
      ? (this._normSquared = this.dot(this))
      : this._normSquared
  }

  get x(): number {
    return this._x
  }

  get y(): number {
    return this._y
  }
}
