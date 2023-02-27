import * as Inscribe from './inscribe'
import { Line, Side } from './line'
import { Vec2 } from './vec2'

export function lineTangentToHull(
  line: Line,
  points: Vec2[],
  halo: number
): { holds: boolean; side: number } {
  let holds = true
  let side = Side.Top

  let k = 0
  while (side === Side.Top && k < points.length) {
    side = line.pointOnSide(points[k], halo)
    k++
  }

  for (let i = k; i < points.length; i++) {
    const testSide = line.pointOnSide(points[i], halo)
    if (testSide === Side.Top) {
      continue
    }
    if (testSide !== side) {
      holds = false
      break
    }
  }

  return { holds, side }
}

/**
 * Solves an optimization problem of finding the shortest third side for a given wedge such that they
 * enclose the given convex hull.
 * Such side, if found, will be generated by a Line which start will lie on the left arm of the wedge
 * and end will be P or Q (as described in the reference to the main function).
 *
 * startVertex is used to define the edge we start from.
 * endVertex is the last possible vertex through which a circle can be fitted into the wedge
 * startVertex > endVertex
 */
function findEnclosingSide(
  wedge: Inscribe.Wedge,
  startVertex: number,
  endVertex: number,
  points: Vec2[],
  halo: number
): { side: Line; stopVertex: number } | null {
  // Enclosing side
  let side: Line | null = null
  // Keep strack at which vertex we stopped
  let stopVertex = startVertex

  let vertex = startVertex

  while (side === null && vertex > endVertex) {
    const p1 = points[vertex]
    const p2 = points[vertex - 1]

    // Edge can be constructed
    const edge = new Line(p1, p2)

    const circlesEdge = wedge.fitCircles(edge, halo)
    if (circlesEdge !== null) {
      // In case of a degenerate wedge there will be 2 circles.
      // In a more commong case of a regular wedge there will be only 1 circle.
      // In each case the circle has to touch the edge and not its extension.
      let tangentParameter = 100
      if (wedge.isDegenerate) {
        // Choose such a circle that it has its centre on a different side
        let sidedness = Side.Top
        let k = 0
        while (sidedness === Side.Top && k < points.length) {
          sidedness = edge.pointOnSide(points[k], halo)
          k++
        }

        tangentParameter =
          edge.pointOnSide(circlesEdge[0].circle.centre) !== sidedness
            ? circlesEdge[0].tangentParameter
            : circlesEdge[1].tangentParameter
      } else {
        tangentParameter = circlesEdge[0].tangentParameter
      }

      // Check whether this tangent point belongs to the edge
      if (tangentParameter > 0 && tangentParameter < 1) {
        const Y = edge.evaluate(tangentParameter)
        const joint = wedge.leftArm.intersectionPoint(edge, halo)!
        side = new Line(joint, Y)
      }
    }

    // Investigate for p2 to generate the side if it's still not found
    if (side === null) {
      const circlesPoint = wedge.fitCircles(p2, halo)
      if (circlesPoint !== null) {
        // In case of a degenerate wedge there will be 2 circles.
        // In a more commong case of a regular wedge there will be only 1 circle.
        // In each case the circle has to also be tangent to the hull.
        let tangent: Line
        if (wedge.isDegenerate) {
          // Choose such a circle that it has its centre on a different side
          let sidedness = Side.Top
          let k = 0
          while (sidedness === Side.Top && k < points.length) {
            sidedness = circlesPoint[0].tangent.pointOnSide(points[k], halo)
            k++
          }

          tangent =
            circlesPoint[0].tangent.pointOnSide(
              circlesPoint[0].circle.centre,
              halo
            ) !== sidedness
              ? circlesPoint[0].tangent
              : circlesPoint[1].tangent
        } else {
          tangent = circlesPoint[0].tangent
        }

        // `tangent` is such that:
        // 1. it is tangent to a circle going through p1,
        // 2. it separates the centre of this circle and the hull points
        // If it is also tangent to the hull => it generates the side
        if (lineTangentToHull(tangent, points, halo).holds) {
          const joint = wedge.leftArm.intersectionPoint(tangent, halo)!
          side = new Line(joint, p2)
        }
      }
    }
    stopVertex = vertex
    vertex--
  }

  return side === null ? null : { side, stopVertex }
}

function findAntipode(points: Vec2[]) {
  // find the farthest point from the start and end point of the range
  let farthestIndex = 0
  let farthestDist = 0

  for (let i = 0, n: number = points.length; i < n; i++) {
    //check if considered point is farther than farthest
    const testDist: number = new Line(points[0], points[n - 1]).distanceToPoint(
      points[i]
    )
    if (testDist > farthestDist) {
      farthestDist = testDist
      farthestIndex = i
    }
  }

  return farthestIndex
}

/**
 * Finds a minimal perimeter triangle enclosing a convex hull of an _arc_ trace
 * The longest side of the hull is considered to be a bottom of the triangle and
 * _is fixed_. This procedure is tailored from the generic algorithm given in
 * http://scholar.uwindsor.ca/cgi/viewcontent.cgi?article=2527&context=etd
 * starting from p. 22; In the notation of the generic algorithm BC is fixed
 */
export function minTriangleWithBase(
  convexHull: Vec2[],
  err: number,
  tol: number
): { A: Vec2; B: Vec2; C: Vec2 } | null {
  // Sides of the triangle
  let AB: Line, AC: Line

  // The arrangement of the points assures that the base is formed by the first
  // and the last point of the hull
  const n = convexHull.length
  const BC = new Line(convexHull[0], convexHull[n - 1])

  // Find the antipodal point to the base, i.e. the farthest point
  const antipodIndex = findAntipode(convexHull)
  const baseParallel = new Line(
    convexHull[antipodIndex],
    convexHull[antipodIndex].plus(BC.delta)
  )!

  // Bootstrap the algorithm with a degenerate wedge
  let wedge = Inscribe.Wedge.new(BC, baseParallel, err)!

  // Progress of the algorithm through the verices (see ref.)
  let Pn = n - 1
  let Qn = antipodIndex

  do {
    //iterations

    const CQinfo = findEnclosingSide(wedge, Pn, antipodIndex, convexHull, err)
    if (CQinfo === null) {
      return null
    }
    ;({ side: AC, stopVertex: Pn } = CQinfo)

    // FYI: Q = AC.end;

    // reconstruct the wedge with left arm as is and right arm being the recently found side
    wedge = Inscribe.Wedge.new(wedge.leftArm, AC, err)!

    const BPinfo = findEnclosingSide(wedge, Qn, 0, convexHull, err)
    if (BPinfo === null) {
      return null
    }
    ;({ side: AB, stopVertex: Qn } = BPinfo)

    // FYI: P = AB.end;

    wedge = Inscribe.Wedge.new(wedge.leftArm, AB, err)!

    // By design |AB| >= |AC| (see ref.), stop when they are close
  } while (AB.length - AC.length > tol)

  const A = AC.intersectionPoint(AB, 0)!
  const B = AB.start
  const C = AC.start

  return { A, B, C }
}

export function minTriangle(
  convexHull: Array<{ x: number; y: number }>,
  err: number,
  tol: number
): {
  A: { x: number; y: number }
  B: { x: number; y: number }
  C: { x: number; y: number }
} | null {
  if (convexHull.length < 3) {
    return null
  }

  if (convexHull.length === 3) {
    return { A: convexHull[0], B: convexHull[1], C: convexHull[2] }
  }

  const points = convexHull.map((p: { x: number; y: number }) => {
    return new Vec2(p.x, p.y)
  })

  let A: Vec2 | null = null
  let B: Vec2 | null = null
  let C: Vec2 | null = null
  let perimeter = -1

  let rotations = 0

  while (rotations < points.length) {
    // rotate array of points
    if (rotations > 0) {
      points.push(points.shift()!)
    }

    // re-calculate the triangle
    const triangle = minTriangleWithBase(points, err, tol)

    //assert triangle is found
    if (triangle !== null) {
      const { A: A1, B: B1, C: C1 } = triangle

      const perimeter1 =
        A1.minus(B1).norm + B1.minus(C1).norm + C1.minus(A1).norm
      if (perimeter1 < perimeter || perimeter === -1) {
        ;[A, B, C] = [A1, B1, C1]
        perimeter = perimeter1
      }
    }

    rotations++
  }

  return perimeter === -1
    ? null
    : {
        A: { x: A!.x, y: A!.y },
        B: { x: B!.x, y: B!.y },
        C: { x: C!.x, y: C!.y }
      }
}
