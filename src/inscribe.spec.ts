import { Wedge } from './inscribe'
import { Line } from './line'
import { Vec2 } from './vec2'

import { assert } from 'chai'

it('constructs a degenerate wedge', () => {
  const leftArm = new Line(new Vec2(0, 0), new Vec2(2, 0))
  const rightArm = new Line(new Vec2(2, -1), new Vec2(0, -1))
  const w = Wedge.new(leftArm, rightArm, 0)

  assert.ok(w !== null)
})

it('constructs a non-degenerate wedge', () => {
  const leftArm = new Line(new Vec2(1, 0), new Vec2(2, 0))
  const rightArm = new Line(new Vec2(2, -2), new Vec2(1, -1))
  const w = Wedge.new(leftArm, rightArm, 0)!

  const controlLeftArm = new Line(new Vec2(0, 0), new Vec2(2, 0))
  const controlRightArm = new Line(new Vec2(0, 0), new Vec2(2, -2))

  assert.ok(w.leftArm.start.equals(controlLeftArm.start, 0))
  assert.ok(w.leftArm.end.equals(controlLeftArm.end, 0))

  assert.ok(w.rightArm.start.equals(controlRightArm.start, 0))
  assert.ok(w.rightArm.end.equals(controlRightArm.end, 0))
})

it('verifies that a line intersects a wedge', () => {
  const leftArm = new Line(new Vec2(0, 0), new Vec2(2, 0))
  const rightArm = new Line(new Vec2(0, 0), new Vec2(0, 2))
  const w = Wedge.new(leftArm, rightArm, 0)!

  let l = new Line(new Vec2(2, -1), new Vec2(-1, 2))

  assert.ok(w.formTriangle(l, 0))

  l = new Line(new Vec2(1, -5), new Vec2(1, 20))

  assert.notOk(w.formTriangle(l, 0))
})

it('verifies that a point is strictly within a wedge', () => {
  const leftArm = new Line(new Vec2(2, 0), new Vec2(0, 0))
  const rightArm = new Line(new Vec2(0, 0), new Vec2(0, 2))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const p: Vec2 = new Vec2(1, 1)

  assert.ok(w.strictlyContains(p, 0))
})

it('verifies that a point is strictly within a degenerate wedge', () => {
  const leftArm = new Line(new Vec2(2, 0), new Vec2(0, 0))
  const rightArm = new Line(new Vec2(5, 2), new Vec2(1, 2))
  const w = Wedge.new(leftArm, rightArm, 0)!
  let p: Vec2 = new Vec2(1, 1)

  assert.ok(w.strictlyContains(p, 0))

  p = new Vec2(1, 3)
  assert.notOk(w.strictlyContains(p, 0))
})

it('fits circles passing through given point in a degenerate wedge (private fit_Dp)', () => {
  // y = x + 2
  const leftArm = new Line(new Vec2(0, 2), new Vec2(1, 3))
  // y = x - 1
  const rightArm = new Line(new Vec2(0, -1), new Vec2(1, 0))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const p = new Vec2(-0.14, 1.2)

  // control values
  const O2 = new Vec2(-0.34136945531623936, 0.15863054468376064)
  const O1 = new Vec2(0.9013694553162392, 1.4013694553162392)
  const r = 1.0606601717798212
  // tangents at point for the circles
  const d1 = O1.minus(p).normal()
  const d2 = O2.minus(p).normal()

  const circlesInfo = w.fitCircles(p, 10 ** -5)!

  assert.ok(circlesInfo[0].circle.centre.minus(O1).norm < 0.0001)
  assert.ok(circlesInfo[1].circle.centre.minus(O2).norm < 0.0001)

  assert.ok(Math.abs(r - circlesInfo[0].circle.r) < 0.0001)
  assert.ok(Math.abs(r - circlesInfo[1].circle.r) < 0.0001)

  assert.ok(circlesInfo[0].tangent.delta.minus(d1).norm < 0.0001)
  assert.ok(circlesInfo[1].tangent.delta.minus(d2).norm < 0.0001)
})

it('fits circles touching given line in a degenerate wedge (private fit_Dl)', () => {
  // y = x + 1
  const leftArm = new Line(new Vec2(0, 1), new Vec2(1, 2))
  // y = x - 1
  const rightArm = new Line(new Vec2(0, -1), new Vec2(1, 0))
  const w = Wedge.new(leftArm, rightArm, 0)!
  // y = 3x+1
  const segment = new Line(new Vec2(0, 1), new Vec2(1, 4))

  // control values
  const o2: Vec2 = new Vec2(0.6180339887498949, 0.6180339887498949)
  const tp2: Vec2 = new Vec2(-0.052786404500042045, 0.841640786499874)
  const o1: Vec2 = new Vec2(-1.618033988749895, -1.618033988749895)
  const tp1: Vec2 = new Vec2(-0.947213595499958, -1.841640786499874)
  const r = 0.7071067811865476

  const circlesInfo = w.fitCircles(segment, 10 ** -5)!

  assert.ok(circlesInfo[0].circle.centre.minus(o1).norm < 0.0001)
  assert.ok(circlesInfo[1].circle.centre.minus(o2).norm < 0.0001)

  assert.ok(Math.abs(r - circlesInfo[0].circle.r) < 0.0001)
  assert.ok(Math.abs(r - circlesInfo[1].circle.r) < 0.0001)

  assert.ok(
    segment.evaluate(circlesInfo[0].tangentParameter).minus(tp1).norm < 0.0001
  )
  assert.ok(
    segment.evaluate(circlesInfo[1].tangentParameter).minus(tp2).norm < 0.0001
  )
})

it('fits a circle passing through given point in a non-degenerate wedge (private fit_NDp) 1', () => {
  // y = 1.5x + 1
  const leftArm = new Line(new Vec2(0, 1), new Vec2(1, 2.5))
  // y = -0.5x + 1
  const rightArm = new Line(new Vec2(0, 1), new Vec2(1, 0.5))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const p = new Vec2(1, 1.5)

  // control values
  const O: Vec2 = new Vec2(3.094087527929452, 1.8216796126142416)
  const r = 2.118650595969362
  // tangents at the point for the circle
  const d: Vec2 = O.minus(p).normal()

  const circleInfo = w.fitCircles(p, 10 ** -5)![0]

  assert.ok(circleInfo.circle.centre.minus(O).norm < 0.0001)
  assert.ok(Math.abs(circleInfo.circle.r - r) < 0.0001)
  assert.ok(circleInfo.tangent.delta.minus(d).norm < 0.0001)
})

it('fits a circle passing through given point in a non-degenerate wedge (private fit_NDp) 2', () => {
  // horizontal and vertical arms
  const leftArm = new Line(new Vec2(0, 2.5), new Vec2(1, 2.5))
  const rightArm = new Line(new Vec2(1, 1), new Vec2(1, 0.5))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const p = new Vec2(0.75, 1.6)

  // control values
  const O = new Vec2(-0.8208203932499367, 0.6791796067500633)
  const r = 1.8208203932499365
  // tangents at the point for the circle
  const d = O.minus(p).normal()

  const circleInfo = w.fitCircles(p, 10 ** -5)![0]

  assert.ok(circleInfo.circle.centre.minus(O).norm < 0.0001)
  assert.ok(Math.abs(circleInfo.circle.r - r) < 0.0001)
  assert.ok(circleInfo.tangent.delta.minus(d).norm < 0.0001)
})

it('fits a circle touching given line in a non-degenerate wedge (private fit_NDl) 1', () => {
  // generic triangle
  const leftArm = new Line(new Vec2(0, 1), new Vec2(1, 2))
  const rightArm = new Line(new Vec2(0, 3), new Vec2(1, 2))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const s = new Line(new Vec2(0, 1), new Vec2(1, 3))

  const control = {
    circle: {
      centre: new Vec2(-1.3874258867227922, 2),
      r: 1.688165034081993
    },
    tangentParameter: 0.12251482265544192
  }

  const circleInfo = w.fitCircles(s, 10 ** -5)![0]

  assert.ok(circleInfo.circle.centre.minus(control.circle.centre).norm < 0.0001)
  assert.ok(Math.abs(circleInfo.circle.r - control.circle.r) < 0.0001)
  assert.ok(
    Math.abs(circleInfo.tangentParameter - control.tangentParameter) < 0.0001
  )
})

it('fits a circle touching given line in a non-degenerate wedge (private fit_NDl) 2', () => {
  // vertical and horizontal arms
  const leftArm = new Line(new Vec2(0, 0), new Vec2(0, 3))
  const rightArm = new Line(new Vec2(0, 0), new Vec2(3, 0))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const s = new Line(new Vec2(2, -1), new Vec2(-2, 3))

  const control = {
    circle: {
      centre: new Vec2(1.7071067811865477, 1.7071067811865477),
      r: 1.7071067811865477
    },
    tangentParameter: 0.375
  }

  const circleInfo = w.fitCircles(s, 10 ** -5)![0]

  assert.ok(circleInfo.circle.centre.minus(control.circle.centre).norm < 0.0001)
  assert.ok(Math.abs(circleInfo.circle.r - control.circle.r) < 0.0001)
  assert.ok(
    Math.abs(circleInfo.tangentParameter - control.tangentParameter) < 0.0001
  )
})

it('fits a circle touching given line in a non-degenerate wedge (private fit_NDl) 3', () => {
  // vertical line
  const leftArm = new Line(new Vec2(-1, -1), new Vec2(4, 4))
  const rightArm = new Line(new Vec2(-1, 0), new Vec2(3, 0))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const s = new Line(new Vec2(2, -1), new Vec2(2, 4))

  const control = {
    circle: {
      centre: new Vec2(3.414213562373095, 1.4142135623730954),
      r: 1.4142135623730947
    },
    tangentParameter: 0.482843
  }

  const circleInfo = w.fitCircles(s, 10 ** -5)![0]

  assert.ok(circleInfo.circle.centre.minus(control.circle.centre).norm < 0.0001)
  assert.ok(Math.abs(circleInfo.circle.r - control.circle.r) < 0.0001)
  assert.ok(
    Math.abs(circleInfo.tangentParameter - control.tangentParameter) < 0.0001
  )
})

it('fits a circle touching given line in a non-degenerate wedge (private fit_NDl) 4', () => {
  // horizontal line
  const leftArm = new Line(new Vec2(-1, -1), new Vec2(4, 4))
  const rightArm = new Line(new Vec2(0, 5), new Vec2(-3, 8))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const s = new Line(new Vec2(2, -1), new Vec2(4, -1))

  const control = {
    circle: {
      centre: new Vec2(2.499999999999998, -9.449747468305835),
      r: 8.449747468305835
    },
    tangentParameter: 0.25
  }

  const circleInfo = w.fitCircles(s, 10 ** -5)![0]

  assert.ok(circleInfo.circle.centre.minus(control.circle.centre).norm < 0.0001)
  assert.ok(Math.abs(circleInfo.circle.r - control.circle.r) < 0.0001)
  assert.ok(
    Math.abs(circleInfo.tangentParameter - control.tangentParameter) < 0.0001
  )
})
