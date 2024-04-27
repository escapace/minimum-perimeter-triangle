import { Wedge } from './inscribe'
import { Line } from './line'
import { Vec2 } from './vec2'

import { it, assert } from 'vitest'

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
  const O2 = new Vec2(-0.341_369_455_316_239_36, 0.158_630_544_683_760_64)
  const O1 = new Vec2(0.901_369_455_316_239_2, 1.401_369_455_316_239_2)
  const r = 1.060_660_171_779_821_2
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
  const o2: Vec2 = new Vec2(0.618_033_988_749_894_9, 0.618_033_988_749_894_9)
  const tp2: Vec2 = new Vec2(-0.052_786_404_500_042_045, 0.841_640_786_499_874)
  const o1: Vec2 = new Vec2(-1.618_033_988_749_895, -1.618_033_988_749_895)
  const tp1: Vec2 = new Vec2(-0.947_213_595_499_958, -1.841_640_786_499_874)
  const r = 0.707_106_781_186_547_6

  const circlesInfo = w.fitCircles(segment, 10 ** -5)!

  assert.ok(circlesInfo[0].circle.centre.minus(o1).norm < 0.0001)
  assert.ok(circlesInfo[1].circle.centre.minus(o2).norm < 0.0001)

  assert.ok(Math.abs(r - circlesInfo[0].circle.r) < 0.0001)
  assert.ok(Math.abs(r - circlesInfo[1].circle.r) < 0.0001)

  assert.ok(segment.evaluate(circlesInfo[0].tangentParameter).minus(tp1).norm < 0.0001)
  assert.ok(segment.evaluate(circlesInfo[1].tangentParameter).minus(tp2).norm < 0.0001)
})

it('fits a circle passing through given point in a non-degenerate wedge (private fit_NDp) 1', () => {
  // y = 1.5x + 1
  const leftArm = new Line(new Vec2(0, 1), new Vec2(1, 2.5))
  // y = -0.5x + 1
  const rightArm = new Line(new Vec2(0, 1), new Vec2(1, 0.5))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const p = new Vec2(1, 1.5)

  // control values
  const O: Vec2 = new Vec2(3.094_087_527_929_452, 1.821_679_612_614_241_6)
  const r = 2.118_650_595_969_362
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
  const O = new Vec2(-0.820_820_393_249_936_7, 0.679_179_606_750_063_3)
  const r = 1.820_820_393_249_936_5
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
      centre: new Vec2(-1.387_425_886_722_792_2, 2),
      r: 1.688_165_034_081_993,
    },
    tangentParameter: 0.122_514_822_655_441_92,
  }

  const circleInfo = w.fitCircles(s, 10 ** -5)![0]

  assert.ok(circleInfo.circle.centre.minus(control.circle.centre).norm < 0.0001)
  assert.ok(Math.abs(circleInfo.circle.r - control.circle.r) < 0.0001)
  assert.ok(Math.abs(circleInfo.tangentParameter - control.tangentParameter) < 0.0001)
})

it('fits a circle touching given line in a non-degenerate wedge (private fit_NDl) 2', () => {
  // vertical and horizontal arms
  const leftArm = new Line(new Vec2(0, 0), new Vec2(0, 3))
  const rightArm = new Line(new Vec2(0, 0), new Vec2(3, 0))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const s = new Line(new Vec2(2, -1), new Vec2(-2, 3))

  const control = {
    circle: {
      centre: new Vec2(1.707_106_781_186_547_7, 1.707_106_781_186_547_7),
      r: 1.707_106_781_186_547_7,
    },
    tangentParameter: 0.375,
  }

  const circleInfo = w.fitCircles(s, 10 ** -5)![0]

  assert.ok(circleInfo.circle.centre.minus(control.circle.centre).norm < 0.0001)
  assert.ok(Math.abs(circleInfo.circle.r - control.circle.r) < 0.0001)
  assert.ok(Math.abs(circleInfo.tangentParameter - control.tangentParameter) < 0.0001)
})

it('fits a circle touching given line in a non-degenerate wedge (private fit_NDl) 3', () => {
  // vertical line
  const leftArm = new Line(new Vec2(-1, -1), new Vec2(4, 4))
  const rightArm = new Line(new Vec2(-1, 0), new Vec2(3, 0))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const s = new Line(new Vec2(2, -1), new Vec2(2, 4))

  const control = {
    circle: {
      centre: new Vec2(3.414_213_562_373_095, 1.414_213_562_373_095_4),
      r: 1.414_213_562_373_094_7,
    },
    tangentParameter: 0.482_843,
  }

  const circleInfo = w.fitCircles(s, 10 ** -5)![0]

  assert.ok(circleInfo.circle.centre.minus(control.circle.centre).norm < 0.0001)
  assert.ok(Math.abs(circleInfo.circle.r - control.circle.r) < 0.0001)
  assert.ok(Math.abs(circleInfo.tangentParameter - control.tangentParameter) < 0.0001)
})

it('fits a circle touching given line in a non-degenerate wedge (private fit_NDl) 4', () => {
  // horizontal line
  const leftArm = new Line(new Vec2(-1, -1), new Vec2(4, 4))
  const rightArm = new Line(new Vec2(0, 5), new Vec2(-3, 8))
  const w = Wedge.new(leftArm, rightArm, 0)!
  const s = new Line(new Vec2(2, -1), new Vec2(4, -1))

  const control = {
    circle: {
      centre: new Vec2(2.499_999_999_999_998, -9.449_747_468_305_835),
      r: 8.449_747_468_305_835,
    },
    tangentParameter: 0.25,
  }

  const circleInfo = w.fitCircles(s, 10 ** -5)![0]

  assert.ok(circleInfo.circle.centre.minus(control.circle.centre).norm < 0.0001)
  assert.ok(Math.abs(circleInfo.circle.r - control.circle.r) < 0.0001)
  assert.ok(Math.abs(circleInfo.tangentParameter - control.tangentParameter) < 0.0001)
})
