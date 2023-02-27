import { assert } from 'chai'
import { Vec2 } from './vec2'

it('multiplies with scalars', () => {
  assert.ok(new Vec2(3, 4).times(-0.5).equals(new Vec2(-1.5, -2), 0))
})

it('divides by scalars', () => {
  assert.ok(new Vec2(3, 4).over(-0.5).equals(new Vec2(-6, -8), 0))
})

it('adds', () => {
  assert.ok(new Vec2(3, 4).plus(new Vec2(2, -0.5)).equals(new Vec2(5, 3.5), 0))
})

it('subtracts', () => {
  assert.ok(new Vec2(3, 4).minus(new Vec2(2, -0.5)).equals(new Vec2(1, 4.5), 0))
})

it('computes norms', () => {
  const v: Vec2 = new Vec2(3, 4)
  assert.ok(v.norm === 5)
})

it('normalizes', () => {
  const v: Vec2 = new Vec2(3, 4)
  assert.ok(v.normalized.norm === 1)
})

it('dots', () => {
  assert.ok(new Vec2(3, 4).dot(new Vec2(2, -0.5)) === 4)
})

it('crosses', () => {
  assert.ok(new Vec2(3, 4).cross(new Vec2(2, -0.5)) === -9.5)
})

it('compute normal of a vector', () => {
  const v: Vec2 = new Vec2(1, 1)
  const n: Vec2 = v.normal()
  assert.ok(n.minus(new Vec2(1, -1)).norm === 0)
})

it('equals with\\without err', () => {
  assert.notOk(new Vec2(0, 0).equals(new Vec2(0.1, 0), 0))
  assert.ok(new Vec2(0, 0).equals(new Vec2(0.1, 0), 0.11))
})
