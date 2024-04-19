import { assert } from 'chai'
import { lineTangentToHull, minTriangleWithBase } from './index'
import { Line } from './line'
import { Vec2 } from './vec2'

it('verifies that a line is tangent to a convex hull', () => {
  const points = [
    new Vec2(1, 3),
    new Vec2(2, 2),
    new Vec2(3, 1),
    new Vec2(3, 0),
    new Vec2(3, -1),
    new Vec2(2, -2),
    new Vec2(1, -3)
  ]
  const line = new Line(new Vec2(3, 3), new Vec2(3, -3))

  assert.ok(lineTangentToHull(line, points, 10 ** -5).holds)
})

it('verifies that a line is not tangent to a convex hull', () => {
  const points = [
    new Vec2(1, 3),
    new Vec2(2, 2),
    new Vec2(3, 1),
    new Vec2(3, 0),
    new Vec2(3, -1),
    new Vec2(2, -2),
    new Vec2(1, -3)
  ]
  const line = new Line(new Vec2(3, 3), new Vec2(2, -3))

  assert.notOk(lineTangentToHull(line, points, 10 ** -5).holds)
})

it('compute minimal perimeter triangle condinitoned on the base', () => {
  // this test contains two funny examples of counter intuitive but correct results
  // 1. the minimal perimeter triangle is generated for the side new Vec2(2, 1), new Vec2(2, 0)
  // 2. the min triangle is different from the expected one by slight shift of the expected tip new Vec2(0, 2.5)
  //    to the left (due counter clockwise search). But such shift indeed delivers smaller perimeter!

  const points = [
    new Vec2(2, 1),
    new Vec2(2, 0),
    new Vec2(-2, 0),
    new Vec2(-2, 1),
    new Vec2(-1, 2),
    new Vec2(0, 2.5),
    new Vec2(1, 2)
  ]

  const { A, B, C } = minTriangleWithBase(points, 10 ** -5, 0.1)!
  assert.ok(A.minus(new Vec2(-2.893_530_107_256_646, 0)).norm < 0.1)
  assert.ok(B.minus(new Vec2(3, 0)).norm < 0.1)
  assert.ok(
    C.minus(new Vec2(-0.112_456_508_967_378_35, 3.112_456_508_967_378_4)).norm <
      0.1
  )
})
