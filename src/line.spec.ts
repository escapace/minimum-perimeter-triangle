import { Line, Side } from './line'
import { Vec2 } from './vec2'
import { it, assert } from 'vitest'

it('computes length', () => {
  const l: Line = new Line(new Vec2(1, 1), new Vec2(4, 5))
  assert.equal(l.length, 5)
})

it('evaluates points', () => {
  const l: Line = new Line(new Vec2(1, 1), new Vec2(4, 5))
  assert.ok(l.evaluate(0.5).equals(new Vec2(2.5, 3), 0))
})

it('computes distance to points', () => {
  const l: Line = new Line(new Vec2(1, 1), new Vec2(4, 5))
  assert.equal(l.distanceToPoint(new Vec2(8, 2)), 5)
})

it('computes point sidedness', () => {
  const l: Line = new Line(new Vec2(1, 1), new Vec2(4, 5))
  assert.ok(l.pointOnSide(new Vec2(8, 2)) === Side.Right)
})

it('computes intersection point', () => {
  const l: Line = new Line(new Vec2(1, 1), new Vec2(4, 5))
  const ll: Line = new Line(new Vec2(4, 1), new Vec2(0, 4))
  assert.ok(l.intersectionPoint(ll, 0)!.equals(new Vec2(52 / 25, 61 / 25), 0))
})
