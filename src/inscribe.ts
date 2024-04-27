/* eslint-disable unicorn/prevent-abbreviations */
import { Line, Side } from './line'
import { Vec2 } from './vec2'

interface Circle {
  centre: Vec2
  r: number
}

/**
 * Class describing a wedge.
 * Wedge can be degenerate, i.e., its arms are parallel,
 * in this case they must point in the same direction
 */
export class Wedge {
  readonly isDegenerate: boolean
  readonly leftArm: Line
  readonly rightArm: Line

  private constructor(leftArm: Line, rightArm: Line, isDegenerate = false) {
    this.leftArm = leftArm
    this.rightArm = rightArm
    this.isDegenerate = isDegenerate
  }

  static new(leftArm: Line, rightArm: Line, error: number): null | Wedge {
    if (leftArm === null || rightArm === null) {
      return null
    }

    if (error !== 0 && leftArm.overlaps(rightArm, error)) {
      return null
    }

    // Check if they are parallel
    // Such value of deviation ensure that angle in between the Lines regardless
    // their lengths is 0.1 radians
    const deviationFromZeroAngle = 0.1 / (leftArm.length * rightArm.length)
    if (leftArm.parallel(rightArm, deviationFromZeroAngle)) {
      // Check if they point in the same direction
      // middle is non-null due to the overlap check
      const middle = new Line(leftArm.evaluate(0.5), rightArm.evaluate(0.5))
      const p = middle.evaluate(0.5)
      // Now p lies in between the arms
      // If arms point in the same direction p must be on the right of one and the left of another
      // --------*------------>
      //          \
      //           \
      //            * p
      //             \
      //       -------*----------->
      const sideLeft = leftArm.pointOnSide(p, error)
      const sideRight = rightArm.pointOnSide(p, error)
      if (sideLeft === Side.Top || sideRight === Side.Top) {
        // eslint-disable-next-line unicorn/error-message
        throw new Error()
      }

      return sideLeft !== sideRight
        ? new Wedge(leftArm, rightArm, true)
        : new Wedge(leftArm, new Line(rightArm.end, rightArm.start))
    }

    // extensions of the wedge intersect, extend or cut the sides appropriately
    // err is set to 0 because we have already established that they intersect under appropriate angle
    const tLA = leftArm.intersectionParameter(rightArm, 0)!
    const tRA = rightArm.intersectionParameter(leftArm, 0)!

    // If it's impossible to tell the excess that need to be cut
    if (tLA === 0.5 || tRA === 0.5) {
      return null
    }

    // W will be the angle point of the wedge
    const W = leftArm.evaluate(tLA)

    // Arrange the arms in a way that they point away from W.
    // Make sure that after the cut, W and corresponding points are at least err distance apart
    const eLA = tLA < 1 - tLA ? leftArm.end : leftArm.start

    const eRA = tRA < 1 - tRA ? rightArm.end : rightArm.start

    return new Wedge(new Line(W, eLA), new Line(W, eRA))
  }

  private fit_Dl(
    l: Line,
    error: number,
  ): Array<{ circle: Circle; tangentParameter: number }> | null {
    if (!this.formTriangle(l, error)) {
      // edge is parallel to the arms
      return null
    }

    // Intersection are ensured by the previous check
    // => A and B are non-null-s
    //  ------(B)*-----*(Ap)---------------(left)------->
    //            \    |
    //             \   |
    //   -----------\--*(I)-------------------
    //               \ |
    //                \|
    //  ---------------*(A)-------------(right)----------->
    const A = l.intersectionPoint(this.rightArm, 0)!
    const B = l.intersectionPoint(this.leftArm, 0)!

    const AB = new Line(A, B)
    const Ap = this.leftArm.closestPoint(A)

    // Line A-Ap is normal to both arms => I = (A+Ap)/2 is within arms of the wedge
    // and ||A-Ap|| is the radius of a circle to inscribe
    const I = A.plus(Ap).over(2)
    const r = A.minus(Ap).norm / 2
    // Now this.right_arm.delta*t + I passes between the arms and parallel to them

    const t1 =
      (AB.delta.cross(A.minus(I)) + r * AB.delta.norm) / AB.delta.cross(this.rightArm.delta)
    const t2 =
      (AB.delta.cross(A.minus(I)) - r * AB.delta.norm) / AB.delta.cross(this.rightArm.delta)

    const o1: Vec2 = this.rightArm.delta.times(t1).plus(I)
    const o2: Vec2 = this.rightArm.delta.times(t2).plus(I)

    return [
      {
        circle: { centre: o1, r },
        tangentParameter: l.closestPointParam(o1),
      },
      {
        circle: { centre: o2, r },
        tangentParameter: l.closestPointParam(o2),
      },
    ]
  }

  private fit_Dp(p: Vec2, error: number): Array<{ circle: Circle; tangent: Line }> | null {
    if (!this.strictlyContains(p, error)) {
      // point is not within the wedge
      return null
    }
    // Intersection are ensured by the previous check
    // => A and B are non-null-s
    //  -----------------------*(Ap)---------------(left)------->
    //                         |
    //                         |
    //                         |
    //   ----------------------*(I)-------------------
    //                         |
    //                         *(p)
    //                         |
    //  -----------------------*(A)----(right)----------->

    const A = this.rightArm.closestPoint(p)
    const Ap = this.leftArm.closestPoint(A)

    // Line A-Ap is normal to both arms => I = (A+Ap)/2 is within arms of the wedge
    // and ||A-Ap|| is the radius of a circle to inscribe
    const I = A.plus(Ap).over(2)
    const r: number = A.minus(Ap).norm / 2
    // Now l = this.right_arm.delta*t + I = D_ra*t + I passes between the arms
    // We need to find Ic on l such that (Ic-p).(Ic-p) = r^2
    // |Ic-p|^2-r^2 = |D_ra*t + I - p|^2-r^2 = (D_ra*t + I - p).(D_ra*t + I - p)-r^2 =
    // |D_ra|^2 t^2 + 2*(I-P).D_ra*t + |I-p|^2 - r^2
    const a = this.rightArm.delta.normSquared
    const b = I.minus(p).dot(this.rightArm.delta) * 2
    const c = I.minus(p).normSquared - r * r
    const discriminant = b * b - 4 * a * c

    if (discriminant < (-10) ** -5) {
      // Account for possible computation errors
      // This should not happen if point is strictly contained within the wedge with a reasonable err
      return null
    }

    const t: number[] = []

    if (Math.abs(discriminant) < 10 ** -5) {
      t.push(-b / (2 * a))
    } else {
      t.push((-b + Math.sqrt(discriminant)) / (2 * a))
      t.push((-b - Math.sqrt(discriminant)) / (2 * a))
    }

    const result: Array<{ circle: Circle; tangent: Line }> = []

    t.forEach((t0: number) => {
      const O = this.rightArm.delta.times(t0).plus(I)
      result.push({
        circle: { centre: O, r },
        tangent: new Line(p, p.plus(O.minus(p).normal())),
      })
    })

    return result
  }

  private fit_NDl(
    l: Line,
    error: number,
  ): Array<{ circle: Circle; tangentParameter: number }> | null {
    if (!this.formTriangle(l, error)) {
      // Edge is parallel to one of the arms
      return null
    }

    // Intersections are ensured by the previous check;
    // => A, B, and C are non-null-s
    // Form a triangle such that:
    // 1. vertex C is the wedge corner point
    const C = this.leftArm.start

    // 2. vertex A is the line-left-arm intersection
    const A = l.intersectionPoint(this.leftArm, 0)!

    // 3. vertex B is the line-right-arm intersection
    const B = l.intersectionPoint(this.rightArm, 0)!

    // => sides of the triangle are
    const AC = new Line(A, C)
    const BC = new Line(B, C)
    const AB = new Line(A, B)

    // lengths of sides
    const a = AC.length
    const b = BC.length
    const c = AB.length
    // half perimeter
    const s = (a + b + c) / 2

    if ((s * (s - a) * (s - b)) / (s - c) < 0) {
      // Case of a very thin triangle
      // Should not happen with a reasonable err
      return null
    }

    // We need to find an escribed circle touching AB
    // Radius of such circle
    const r = Math.sqrt((s * (s - a) * (s - b)) / (s - c))

    const det: number = AB.delta.cross(AC.delta)

    const lhsAll: Vec2[] = [
      new Vec2(B.cross(A) + r * c, C.cross(A) + r * a),
      new Vec2(B.cross(A) + r * c, C.cross(A) - r * a),
      new Vec2(B.cross(A) - r * c, C.cross(A) + r * a),
      new Vec2(B.cross(A) - r * c, C.cross(A) - r * a),
    ]

    // Possible centres
    const OAll: Vec2[] = []
    lhsAll.forEach((lhs: Vec2) => {
      OAll.push(
        new Vec2(
          new Vec2(AB.delta.x, AC.delta.x).cross(lhs),
          new Vec2(AB.delta.y, AC.delta.y).cross(lhs),
        ).over(-det),
      )
    })

    //choose the one touching the third side
    let o: null | Vec2 = null
    const dists: Array<{ norm: number; raw: number }> = []
    for (const O of OAll) {
      dists.push({
        norm: Math.abs(BC.distanceToPoint(O) / r - 1),
        raw: Math.abs(BC.distanceToPoint(O) - r),
      })
      // absolute error --- is the distance between circle and a line, this is the ultimate measure of closeness
      const absoluteError = Math.abs(BC.distanceToPoint(O) - r)
      // relative error --- is the distance between circle and a line normalized to the radius
      // this measure is usefull when circle has a very large radius and absolute error might grow
      const relativeError = Math.abs(BC.distanceToPoint(O) / r - 1)
      if (
        (absoluteError < 10 ** -5 || relativeError < 10 ** -5) &&
        AC.pointOnSide(O) !== BC.pointOnSide(O)
      ) {
        o = O
        break
      }
    }

    let message = ''
    if (o === null) {
      message = 'fit_NDl, centre is undefined'
      for (let index = 0; index < OAll.length; index++) {
        message += `centre: (${OAll[index].x}, ${OAll[index].y}), r: ${r}, dist raw: ${dists[index].raw},  dist norm: ${dists[index].norm}\n`
      }
    }
    if (o === null) {
      throw new Error(message)
    }

    return [
      {
        circle: { centre: o, r },
        tangentParameter: l.closestPointParam(o),
      },
    ]
  }

  // While fitting circles into a wedge
  // There are four distinct cases:
  // 1. Wedge is degenerate and additional element is a point
  // 2. Wedge is degenerate and additional element is a line
  // 3. Wedge is non-degenerate and additional element is a point
  // 4. Wedge is non-degenerate and additional element is a line
  // according to these assumptions, the following methods are named

  private fit_NDp(p: Vec2, error: number): Array<{ circle: Circle; tangent: Line }> | null {
    if (!this.strictlyContains(p, error)) {
      return null
    }
    // Point is in-between the wedge's arms

    //              *(C)
    //             /|
    //            / |
    //           /  |
    //          /   |
    //         /    |
    //        / *(p)|
    //       /      |
    //   (A)*       *(B)

    // By construction of wedge
    const C = this.leftArm.start // or = this.right_arm.end
    const A = this.leftArm.end
    const B = this.rightArm.end

    const a: number = C.minus(B).norm
    const b: number = C.minus(A).norm

    const D = A.minus(B)
      .times(a / (a + b))
      .plus(B)

    const bisector = new Line(C, D)

    const // coefficients for quadratic equations
      eA = D.minus(C).normSquared - (A.minus(C).cross(D.minus(C)) / b) ** 2
    const eB = D.minus(C).dot(C.minus(p)) * 2
    const eC = C.minus(p).normSquared
    const discriminant = eB * eB - 4 * eA * eC

    if (discriminant < (-10) ** -5) {
      // Account for possible computation errors
      // This should not happen if point is strictly contained within the wedge with a reasonable err
      return null
    }

    let O: Vec2, r: number

    if (Math.abs(discriminant) < 10 ** -5) {
      const t = -eB / (2 * eA)
      O = bisector.evaluate(t)
      r = O.minus(p).norm
    } else {
      const t1 = (-eB + Math.sqrt(discriminant)) / (2 * eA)
      const t2 = (-eB - Math.sqrt(discriminant)) / (2 * eA)
      // Pick the value corresponding to larger radius
      if (bisector.evaluate(t1).minus(p).normSquared > bisector.evaluate(t2).minus(p).normSquared) {
        O = bisector.evaluate(t1)
        r = bisector.evaluate(t1).minus(p).norm
      } else {
        O = bisector.evaluate(t2)
        r = bisector.evaluate(t2).minus(p).norm
      }
    }

    return [
      {
        circle: { centre: O, r },
        tangent: new Line(p, p.plus(O.minus(p).normal())),
      },
    ]
  }

  fitCircles(element: Vec2, error: number): Array<{ circle: Circle; tangent: Line }> | null

  fitCircles(
    element: Line,
    error: number,
  ): Array<{ circle: Circle; tangentParameter: number }> | null

  fitCircles(element: Line | Vec2, error: number) {
    if (element instanceof Vec2) {
      return this.isDegenerate ? this.fit_Dp(element, error) : this.fit_NDp(element, error)
    }
    if (element instanceof Line) {
      return this.isDegenerate
        ? this.fit_Dl(element instanceof Line ? element : element, error)
        : this.fit_NDl(element instanceof Line ? element : element, error)
    }
    return null
  }

  formTriangle(line: Line, error: number): boolean {
    const thin =
      this.leftArm.parallel(line, 0.1 / (this.leftArm.length * line.length)) ||
      this.rightArm.parallel(line, 0.1 / (this.rightArm.length * line.length))
    if (thin) {
      return false
    }

    const A = line.intersectionPoint(this.leftArm, 0)!
    const B = line.intersectionPoint(this.rightArm, 0)!

    if (this.isDegenerate) {
      return !A.equals(B, error)
    }

    const C = this.leftArm.intersectionPoint(this.rightArm, 0)!

    return (
      !C.equals(A, error) &&
      !C.equals(B, error) &&
      !A.equals(B, error) &&
      !new Line(A, B).pointOnTop(C, error)
    )
  }
  looselyContains(p: Vec2, error: number): boolean {
    const pLeft = this.leftArm.pointOnSide(p, error)
    const pRight = this.rightArm.pointOnSide(p, error)

    if (pLeft === Side.Top || pRight === Side.Top) {
      return true
    }

    // Point is on neither arms; To be within the wedge it:
    // 1. must lie on different sides w.r.t. the arms
    if (pLeft === pRight) {
      return false
    }

    return this.isDegenerate
      ? // degenerate + different sides => true
        true
      : // 2. (Because the arms intersect)
        // Projection params of the point onto the arms must be larger than 0
        this.leftArm.closestPointParam(p) >= 0 && this.rightArm.closestPointParam(p) >= 0
  }
  strictlyContains(p: Vec2, error: number): boolean {
    const pLeft = this.leftArm.pointOnSide(p, error)
    const pRight = this.rightArm.pointOnSide(p, error)

    if (pLeft === Side.Top || pRight === Side.Top) {
      return false
    }

    // Point is on neither arms; To be within the wedge it:
    // 1. must lie on different sides w.r.t. the arms
    if (pLeft === pRight) {
      return false
    }

    return this.isDegenerate
      ? // degenerate + different sides => true
        true
      : // 2. (Because the arms intersect)
        // Projection params of the point onto the arms must be larger than 0
        this.leftArm.closestPointParam(p) >= 0 && this.rightArm.closestPointParam(p) >= 0
  }

  toString(): string {
    return (
      `LA: ${this.leftArm.start.toString()} --> ${this.leftArm.end.toString()}\n` +
      `RA: ${this.rightArm.start.toString()} --> ${this.rightArm.end.toString()}`
    )
  }
}
