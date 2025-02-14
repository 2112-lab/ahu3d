/**
 * @class Collision
 * @description Class for computing intersections between two lines and determining whether they intersect.
 */
export default class Collision {
    
    /**
     * @method computeIntersection
     * @description Computes the intersection point between two lines if it exists.
     * @param {Object} line1 - The first line object containing start and end points (e.g., {start: {x, y}, end: {x, y}}).
     * @param {Object} line2 - The second line object containing start and end points (e.g., {start: {x, y}, end: {x, y}}).
     * @returns {Object|String} The intersection point as an object {x, y} or a status string indicating the result ("zero_or_infinity", "no_intersection", or "computed").
     */
    computeIntersection(line1, line2) {
        let p1 = line1.start; // Start point of the first line.
        let p2 = line1.end;   // End point of the first line.
        let p3 = line2.start; // Start point of the second line.
        let p4 = line2.end;   // End point of the second line.

        // Compute the denominator of the intersection formula.
        var d1 = (p1.x - p2.x) * (p3.y - p4.y); // (x1 - x2) * (y3 - y4)
        var d2 = (p1.y - p2.y) * (p3.x - p4.x); // (y1 - y2) * (x3 - x4)
        var d = d1 - d2; // Final denominator value.

        // If the denominator is zero, the lines are parallel or coincident.
        if (d == 0) {
            this.status = "zero_or_infinity"; // Set status to indicate zero or infinite intersections.
            return this.status;
        }

        // Compute the numerator values for the intersection point formula.
        var u1 = p1.x * p2.y - p1.y * p2.x; // (x1 * y2 - y1 * x2)
        var u4 = p3.x * p4.y - p3.y * p4.x; // (x3 * y4 - y3 * x4)

        var u2x = p3.x - p4.x; // (x3 - x4)
        var u3x = p1.x - p2.x; // (x1 - x2)
        var u2y = p3.y - p4.y; // (y3 - y4)
        var u3y = p1.y - p2.y; // (y1 - y2)

        // Compute the intersection point coordinates (px, py).
        var px = (u1 * u2x - u3x * u4) / d;
        var py = (u1 * u2y - u3y * u4) / d;

        var p = { x: px, y: py }; // Create the intersection point object.
        this.xPoint.setXY(Number(px.toFixed(2)), Number(py.toFixed(2))); // Set the intersection point with precision to two decimal places.

        this.lines.push(line1); // Store line1 in the lines array.
        this.lines.push(line2); // Store line2 in the lines array.

        // Check if the computed intersection point lies on both line segments.
        const isIntersection = this.checkLineIntersection(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);

        if (!isIntersection) {
            this.status = "no_intersection"; // Set status if there is no valid intersection.
            return this.status;
        }

        this.status = "computed"; // Set status to indicate the intersection has been successfully computed.
        return p; // Return the computed intersection point.
    }

    /**
     * @method checkLineIntersection
     * @description Checks if two line segments intersect.
     * @param {Number} p1x - X-coordinate of the start point of the first line.
     * @param {Number} p1y - Y-coordinate of the start point of the first line.
     * @param {Number} p2x - X-coordinate of the end point of the first line.
     * @param {Number} p2y - Y-coordinate of the end point of the first line.
     * @param {Number} p3x - X-coordinate of the start point of the second line.
     * @param {Number} p3y - Y-coordinate of the start point of the second line.
     * @param {Number} p4x - X-coordinate of the end point of the second line.
     * @param {Number} p4y - Y-coordinate of the end point of the second line.
     * @returns {Boolean} True if the lines intersect, otherwise false.
     */
    checkLineIntersection(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) {
        var denominator = (p4y - p3y) * (p2x - p1x) - (p4x - p3x) * (p2y - p1y); // Compute the denominator for the intersection formula.

        // If the denominator is zero, the lines are parallel and do not intersect.
        if (denominator == 0) {
            return false;
        }

        // Calculate the intersection factors (ua and ub) for each line.
        var ua = ((p4x - p3x) * (p1y - p3y) - (p4y - p3y) * (p1x - p3x)) / denominator;
        var ub = ((p2x - p1x) * (p1y - p3y) - (p2y - p1y) * (p1x - p3x)) / denominator;

        // If ua and ub are between 0 and 1, the lines intersect within their segment bounds.
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            return true;
        }

        // Return false if there is no valid intersection within the bounds of both line segments.
        return false;
    }
}
