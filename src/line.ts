import type { Vec2 } from './vec2'

export enum Side {
  Left = 1,
  Right = -1,
  Top = 0
}

export class Line {
  readonly delta: Vec2
  readonly end: Vec2
  readonly start: Vec2

  constructor(start: Vec2, end: Vec2) {
    this.start = start
    this.end = end
    this.delta = end.minus(start)
  }

  closestPoint(p: Vec2): Vec2 {
    return this.evaluate(this.closestPointParam(p))
  }

  closestPointParam(p: Vec2): number {
    return this.delta.dot(p.minus(this.start)) / this.delta.normSquared
  }

  distanceToPoint(p: Vec2): number {
    return (
      Math.abs(p.cross(this.delta) - this.start.cross(this.end)) /
      this.delta.norm
    )
  }

  evaluate(t: number): Vec2 {
    return this.start.plus(this.delta.times(t))
  }

  intersectionParameter(that: Line, error: number): null | number {
    const d = this.delta.cross(that.delta)
    if (d === 0 || Math.abs(d) < error) {
      return null // lines are parallel
    }
    const dStart: Vec2 = this.start.minus(that.start)
    return that.delta.cross(dStart) / d
  }

  intersectionPoint(that: Line, error: number): null | Vec2 {
    const t = this.intersectionParameter(that, error)
    return t === null ? null : this.evaluate(t)
  }

  overlaps(that: Line, error: number): boolean {
    return (
      this.pointOnTop(that.start, error) && this.pointOnTop(that.end, error)
    )
  }

  /**
   *  If alpha is less than deviationFromZeroAngle, the 2 lines are
   *  considered parallel.
   *  _______________________________
   *                        alpha (/
   *                              /
   *                             /
   *                            /
   */
  parallel(that: Line, deviationFromZeroAngle: number): boolean {
    const d: number = Math.abs(this.delta.cross(that.delta))
    //https://en.wikipedia.org/wiki/Cross_product#Geometric_meaning
    return (
      d === 0 ||
      d < this.length * this.length * Math.sin(deviationFromZeroAngle)
    )
  }

  pointOnSide(p: Vec2, error = 0): number {
    const number_ = this.start.cross(this.end) - p.cross(this.delta)
    if (number_ === 0 || Math.abs(number_) / this.delta.norm < error) {
      return Side.Top
    }
    return number_ > 0 ? Side.Left : Side.Right
  }

  pointOnTop(p: Vec2, error: number): boolean {
    return this.pointOnSide(p, error) === Side.Top
  }

  /**
   * Length of a line is the length between its two defining points
   */
  get length(): number {
    return this.delta.norm
  }
}
